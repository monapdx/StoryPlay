import { useEffect, useState } from "react";
import { getHashRoute } from "../utils/hashRoute";

export default function useHashRoute() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}
