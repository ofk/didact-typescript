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

const render = (element: DidactElement, container: HTMLElement): void => {
  // TODO create dom nodes
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
