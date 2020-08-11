// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    a: HTMLAttributes<HTMLAnchorElement>;
    b: HTMLAttributes<HTMLElement>;
  }
}

type HTMLAttributes<T> = Partial<T>;

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById('root');

ReactDOM.render(element, container);
