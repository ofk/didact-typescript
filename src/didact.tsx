// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    a: HTMLAttributes<HTMLAnchorElement>;
    b: HTMLAttributes<HTMLElement>;
  }
}

type HTMLAttributes<T> = Partial<T>;

interface DidactElement {
  type: string;
  props: Record<string, unknown> & { children: unknown[] };
}

const createElement = (
  type: string,
  props: Record<string, unknown>,
  ...children: unknown[]
): DidactElement => ({
  type,
  props: {
    ...props,
    children,
  },
});

const Didact = {
  createElement,
};

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
