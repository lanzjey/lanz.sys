import { createContext } from "react";

// App-level navigate(id), shared with any section that needs a "Back to Menu" control.
export const NavContext = createContext(() => {});
