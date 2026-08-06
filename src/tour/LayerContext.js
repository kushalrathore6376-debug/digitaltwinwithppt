import { createContext } from "react";

// Which layer a <Section> sits in — "exterior", "cutaway", or "shared" —
// so it can combine its own focus state with the cross-fade between the two
// representations instead of fighting it.
//
// It lives in its own module because a file that exports both components
// and non-components breaks fast refresh.
export const LayerContext = createContext("exterior");
