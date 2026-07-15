import { useEffect, useState } from "react";
import { parseHashRoute, type ParsedHashRoute } from "../utils/hashRoute";

export default function useHashRoute(): ParsedHashRoute {
  const [parsed, setParsed] = useState(parseHashRoute);

  useEffect(() => {
    const onHashChange = () => setParsed(parseHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return parsed;
}
