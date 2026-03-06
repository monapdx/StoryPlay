function DefaultBehavior() {
  return null;
}

export default function NodeBehaviorRenderer({ node }) {
  const behavior = node?.data?.behavior || { kind: "none", config: {} };

  switch (behavior.kind) {
    case "none":
    default:
      return <DefaultBehavior />;
  }
}