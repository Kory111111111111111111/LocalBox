import { Route, Router, Switch } from "wouter";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Category from "./pages/Category";
import ToolPage from "./pages/ToolPage";
import Terms from "./pages/Terms";
import LlmsTxt from "./pages/LlmsTxt";
import NotFound from "./pages/NotFound";
import { routerBase } from "./lib/paths";

export default function App() {
  return (
    <Router base={routerBase}>
      <AppShell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/category/:id" component={Category} />
          <Route path="/tools/:slug" component={ToolPage} />
          <Route path="/about" component={Home} />
          <Route path="/privacy" component={Home} />
          <Route path="/terms" component={Terms} />
          <Route path="/llms" component={LlmsTxt} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </Router>
  );
}
