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

let nextUnitOfWork: unknown = null;

const performUnitOfWork = (fiber: unknown): void => {
  // TODO
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
  // create dom nodes
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = (key: string): boolean => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = element.props[name];
    });

  // TEXT_ELEMENT has no children.
  element.props.children.forEach((child) => render(child, (dom as unknown) as HTMLElement));
  container.appendChild(dom);
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
