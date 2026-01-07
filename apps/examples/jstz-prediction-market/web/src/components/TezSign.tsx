import { ComponentProps } from "react";

export function TezSign(props: Omit<ComponentProps<"p">, "children">) {
  return <span {...props}>ꜩ</span>;
}
