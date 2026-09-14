import { Route, Switch } from "wouter";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Category from "./pages/Category";
import ToolPage from "./pages/ToolPage";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/category/:id" component={Category} />
        <Route path="/tools/:slug" component={ToolPage} />
        <Route path="/about" component={Home} />
        <Route path="/privacy" component={Home} />
        <Route path="/contact" component={Home} />
        <Route path="/terms" component={Terms} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}
