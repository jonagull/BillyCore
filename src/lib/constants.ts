import { dev } from "$app/environment";

export let baseUrl = "";
// Toggles a bit render logic in different views, changing the behavior, 
// isMultiple basically adds support for more than two players 
export let isMultipleTenant = true;
// Renders Play page that is made for darts game tracking
export let isDarts = true;

baseUrl = "http://localhost:5219/api";

// if (dev) {
//     baseUrl = import.meta.env.VITE_API_URL;
// }
