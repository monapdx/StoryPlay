import { useEffect, useState } from "react";
import { parseHashRoute } from "../utils/hashRoute";

export default function useHashRoute() {
  const [parsed, setParsed] = useState(parseHashRoute);

  useEffect(() => {
    const onHashChange = () => setParsed(parseHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return parsed;
}
