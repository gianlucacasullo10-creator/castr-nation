const Terms = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-primary rounded-3xl px-8 py-3 mb-4">
            <span className="text-3xl font-black italic tracking-tighter text-black">CASTRS</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Terms of Use</h1>
          <p className="text-muted-foreground font-medium text-sm">Last updated: March 2026</p>
        </div>

        <div className="space-y-6 text-sm text-foreground">

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Acceptance</h2>
            <p className="text-muted-foreground">
              By using CASTRS, you agree to these Terms. If you don't agree, please do not use the app.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Use of the App</h2>
            <p className="text-muted-foreground">
              CASTRS is a social fishing app. You agree to use it lawfully, to post only catches you personally made, and not to harass other users. We reserve the right to suspend accounts that violate these terms.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">CASTRS Pro Subscription</h2>
            <p className="text-muted-foreground">
              CASTRS Pro is available for $4.99/month. Your subscription automatically renews each month until you cancel. You can cancel at any time through your Apple ID subscription settings. No refunds are provided for partial months. After cancellation, Pro benefits remain active until the end of the current billing period.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Virtual Items</h2>
            <p className="text-muted-foreground">
              Points, gear, and other virtual items in CASTRS have no real-world value and cannot be exchanged for cash. We reserve the right to modify or remove virtual items at any time.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of photos and content you post. By posting, you grant CASTRS a non-exclusive license to display your content within the app. Do not post content that is illegal, offensive, or infringes on others' rights.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Disclaimer</h2>
            <p className="text-muted-foreground">
              CASTRS is provided "as is" without warranty. We are not responsible for any damages arising from your use of the app. Always follow local fishing regulations and safety guidelines.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms?{" "}
              <a href="mailto:support@castrs.app" className="text-primary font-bold underline">
                support@castrs.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
