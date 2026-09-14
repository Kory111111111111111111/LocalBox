import { usePageTitle } from "../lib/usePageTitle";

export function TermsBody() {
  return (
      <div className="space-y-6 text-sm text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-ink font-semibold mb-1.5">Acceptance</h2>
          <p>
            By using LocalToolBox you agree to these terms. The project is provided free of charge,
            as open-source software, without an account system.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">No warranty</h2>
          <p>
            LocalToolBox is provided “as is”, without warranty of any kind, express or implied,
            including but not limited to the warranties of merchantability, fitness for a
            particular purpose, and noninfringement. Use it at your own risk. Always keep backups
            of important files before processing them with any tool.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the authors and contributors of LocalToolBox
            shall not be liable for any claim, damages, or other liability arising from, out of, or
            in connection with the software or its use.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">Calculators and informational tools</h2>
          <p>
            Financial, health, and measurement calculators (loan payments, BMI, calorie needs,
            tax, and similar) are provided for information only. They are not financial, medical,
            or professional advice. Consult a qualified professional before making decisions based
            on their output.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">Generators and test data</h2>
          <p>
            Fake-data generators produce clearly synthetic data for software testing and design
            mockups. The test credit-card tool generates Luhn-valid numbers that are not real
            cards; using them to commit fraud or misrepresent identity is illegal, and the tool
            must not be used for any unlawful purpose.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">Lawful and respectful use</h2>
          <p>
            You agree to use the tools lawfully. Network utilities (DNS, WHOIS, port checks) must
            only be pointed at systems you own or are authorized to test. Do not use the tools to
            harass, attack, or spy on anyone.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">Your content</h2>
          <p>
            You keep all rights to anything you process with LocalToolBox. Since files are handled
            locally, you're the only party involved — we make no claim to your content and never
            see it.
          </p>
        </section>

        <section>
          <h2 className="text-ink font-semibold mb-1.5">License of the app itself</h2>
          <p>
            LocalToolBox source code is released under the MIT License. Third-party libraries and
            AI models remain under their own licenses, listed in THIRD_PARTY_NOTICES.md.
          </p>
        </section>
      </div>
  );
}

export default function Terms() {
  usePageTitle("Terms of use — LocalToolBox");
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Terms of use</h1>
      <p className="text-sm text-ink-dim mb-6">Last updated: September 2026</p>
      <TermsBody />
    </div>
  );
}
