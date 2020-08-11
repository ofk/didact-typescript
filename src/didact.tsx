/* eslint-disable no-param-reassign */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    a: HTMLAttributes<HTMLAnchorElement>;
    b: HTMLAttributes<HTMLElement>;
  }
}

type DOMAttributes = {
  children?: DidactNode;
};

type HTMLAttributes<T> = Partial<Omit<T, keyof DOMAttributes>> & DOMAttributes;

type DidactNode = DidactElement | string;

interface DidactElement {
  type: string;
  props: Record<string, unknown> & { children: DidactElement[] };
}

interface DidactFiber extends DidactElement {
  dom: HTMLElement | Text | null;
  parent?: DidactFiber;
  child?: DidactFiber;
  sibling?: DidactFiber;
}

const createTextElement = (text: string): DidactElement => ({
  type: 'TEXT_ELEMENT',
  props: {
    nodeValue: text,
    children: [],
  },
});

const createElement = (
  type: string,
  props: Record<string, unknown>,
  ...children: DidactNode[]
): DidactElement => ({
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === 'object' ? child : createTextElement(child)
    ),
  },
});

const createDom = (fiber: DidactFiber): HTMLElement | Text => {
  // create dom nodes
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  const isProperty = (key: string): boolean => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = fiber.props[name];
    });

  return dom;
};

let nextUnitOfWork: DidactFiber | null = null;

const performUnitOfWork = (fiber: DidactFiber): DidactFiber | null => {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    if (!fiber.parent.dom) throw new Error('Invalid fiber');
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: DidactFiber | null = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber: DidactFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      if (!prevSibling) throw new Error('Invalid fiber');
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index += 1;
  }

  // return next unit of work
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: DidactFiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent || null;
  }
  return nextFiber;
};

const workLoop = (deadline: IdleDeadline): void => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const render = (element: DidactElement, container: HTMLElement): void => {
  // set next unit of work
  nextUnitOfWork = {
    dom: container,
    type: '',
    props: {
      children: [element],
    },
  };
};

const Didact = {
  createElement,
  render,
};

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById('root')!;

Didact.render(element, container);
