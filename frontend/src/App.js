import { jsx as _jsx } from "react/jsx-runtime";
import Providers from '@/app/providers';
import Router from '@/app/Router';
export default function App() {
    return (_jsx(Providers, { children: _jsx(Router, {}) }));
}
