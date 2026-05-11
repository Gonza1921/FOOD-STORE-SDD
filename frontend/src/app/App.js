import { jsx as _jsx } from "react/jsx-runtime";
import Providers from './providers';
import Router from './Router';
export default function App() {
    return (_jsx(Providers, { children: _jsx(Router, {}) }));
}
