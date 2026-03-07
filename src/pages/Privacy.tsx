const Privacy = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-primary rounded-3xl px-8 py-3 mb-4">
            <span className="text-3xl font-black italic tracking-tighter text-black">CASTRS</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium text-sm">Last updated: March 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-sm text-foreground">

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly: your name, email address, profile photo, and fishing catch data (species, location, photo). We also collect usage data and device identifiers to improve the app experience and serve relevant advertising.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">How We Use Your Information</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>To provide and maintain the CASTRS app</li>
              <li>To display your catches on leaderboards and feeds</li>
              <li>To process your CASTRS Pro subscription</li>
              <li>To show relevant advertisements (free tier)</li>
              <li>To send important updates about your account</li>
            </ul>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Advertising</h2>
            <p className="text-muted-foreground">
              The free version of CASTRS displays ads powered by Google AdMob. With your permission (requested via the App Tracking Transparency prompt), we may use your device's advertising identifier to show more relevant ads. You can opt out at any time in your device's Privacy settings. CASTRS Pro subscribers see no ads.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We share data only with service providers necessary to operate the app (Supabase for database hosting, RevenueCat for subscription management, Google AdMob for advertising). All providers are contractually obligated to protect your data.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Location Data</h2>
            <p className="text-muted-foreground">
              With your permission, we access your location to tag your catch with a city name. Precise coordinates are stored only to enable the catch location feature and are not shared with third parties.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Your Rights</h2>
            <p className="text-muted-foreground">
              You may request access to, correction of, or deletion of your personal data at any time by contacting us at castrs102@gmail.com. Account deletion requests are processed within 30 days.
            </p>
          </section>

          <section className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at:{" "}
              <a href="mailto:castrs102@gmail.com" className="text-primary font-bold underline">
                castrs102@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
