const Support = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-primary rounded-3xl px-8 py-3 mb-4">
            <span className="text-3xl font-black italic tracking-tighter text-black">CASTRS</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Support</h1>
          <p className="text-muted-foreground font-medium">We're here to help</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card border-2 border-muted rounded-3xl p-6 space-y-2">
            <h2 className="font-black uppercase text-sm">Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              For any questions, issues, or feedback, email us at:
            </p>
            <a
              href="mailto:support@castrs.app"
              className="text-primary font-bold text-sm underline"
            >
              support@castrs.app
            </a>
          </div>

          <div className="bg-card border-2 border-muted rounded-3xl p-6 space-y-3">
            <h2 className="font-black uppercase text-sm">Frequently Asked Questions</h2>

            <div className="space-y-1">
              <p className="text-sm font-bold">How do I submit a catch?</p>
              <p className="text-sm text-muted-foreground">
                Tap the camera icon in the bottom navigation, take a photo of your fish, enter the species and location, then tap Verify &amp; Submit.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold">How do I cancel my CASTRS Pro subscription?</p>
              <p className="text-sm text-muted-foreground">
                Open Settings on your iPhone → Tap your name → Subscriptions → CASTRS → Cancel Subscription.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold">My purchases aren't showing up</p>
              <p className="text-sm text-muted-foreground">
                Go to the CASTRS Pro page and tap "Restore Purchases" to sync your subscription status.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold">How do I delete my account?</p>
              <p className="text-sm text-muted-foreground">
                Email us at support@castrs.app with your account email and we'll delete your account and data within 30 days.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CASTRS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Support;
