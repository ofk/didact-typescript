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
  alternate?: DidactFiber | null;
  effectTag?: string;
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

const isEvent = (key: string): boolean => key.startsWith('on');

const isProperty = (key: string): boolean => key !== 'children' && !isEvent(key);

const isNew = (prev: DidactElement['props'], next: DidactElement['props']) => (
  key: string
): boolean => prev[key] !== next[key];

const isGone = (_prev: DidactElement['props'], next: DidactElement['props']) => (
  key: string
): boolean => !(key in next);

const updateDom = (
  dom: HTMLElement | Text,
  prevProps: DidactElement['props'],
  nextProps: DidactElement['props']
): void => {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name] as EventListener);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = '';
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name] as EventListener);
    });
};

const createDom = (fiber: DidactFiber): HTMLElement | Text => {
  // create dom nodes
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, { children: [] }, fiber.props);

  return dom;
};

let nextUnitOfWork: DidactFiber | null = null;
let currentRoot: DidactFiber | null = null;
let wipRoot: DidactFiber | null = null;
let deletions: DidactFiber[] | null = null;

const commitWork = (fiber: DidactFiber | null | undefined): void => {
  if (!fiber) {
    return;
  }
  if (!fiber.parent) throw new Error('Invalid fiber');
  const domParent = fiber.parent.dom;
  if (!domParent) throw new Error('Invalid fiber');
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate?.props || { children: [] }, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    if (!fiber.dom) throw new Error('Invalid fiber');
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitRoot = (): void => {
  if (!deletions) throw new Error('Invalid commitRoot call');
  if (!wipRoot) throw new Error('Invalid commitRoot call');
  // add nodes to dom
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const reconcileChildren = (wipFiber: DidactFiber, elements: DidactElement[]): void => {
  if (!deletions) throw new Error('Invalid reconcileChildren call');

  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: DidactFiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: DidactFiber | null = null;

    // compare oldFiber to element
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType && oldFiber) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber || undefined;
    } else if (element) {
      if (!prevSibling) throw new Error('Invalid fiber');
      prevSibling.sibling = newFiber || undefined;
    }

    prevSibling = newFiber;
    index += 1;
  }
};

const performUnitOfWork = (fiber: DidactFiber): DidactFiber | null => {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // create new fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const render = (element: DidactElement, container: HTMLElement): void => {
  // set next unit of work
  wipRoot = {
    dom: container,
    type: '',
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
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
