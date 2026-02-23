// wallet.js - Payment & Credits (Stripe + credits service)

// ========================
// PRICING
// ========================
const MIN_DEPOSIT = 20;
const MAX_DEPOSIT = 500;

/**
 * processPayment
 * - Reads amount from #creditSlider
 * - Validates amount ($20–$500)
 * - Ensures user is logged in
 * - Fetches current user via /api/auth/me
 * - Creates Stripe Checkout session via /api/credits/checkout/create
 * - Redirects browser to Stripe checkout URL
 */
async function processPayment() {
  const slider = document.getElementById("creditSlider");
  if (!slider) {
    if (typeof showToast === "function") {
      showToast("Payment slider not found.", "error");
    }
    return;
  }

  const amount = parseInt(slider.value, 10);

  // Match pricing constraints MIN_DEPOSIT / MAX_DEPOSIT (20–500)
  if (Number.isNaN(amount) || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
    if (typeof showToast === "function") {
      showToast("Amount must be $20–$500", "error");
    }
    return;
  }

  if (!appState.authToken) {
    if (typeof showToast === "function") {
      showToast("Please login first", "error");
    }
    if (typeof showLogin === "function") showLogin();
    return;
  }

  if (typeof showLoading === "function") {
    showLoading("Processing payment...");
  }

  try {
    // 1) Get authenticated user so we have id + email
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${appState.authToken}` },
    });

    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meData.user) {
      throw new Error(
        meData.error || meData.message || "Unable to load account",
      );
    }

    const user = meData.user;

    // 2) Create a Stripe Checkout session for wallet credits
    const payload = {
      userId: user.id,
      email: user.email,
      amount,      // dollars
      credits: amount, // 1 wallet credit == $1
      type: "wallet",
    };
    console.log("Checkout payload:", payload);

    const checkoutRes = await fetch(
      `${API_BASE}/api/credits/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appState.authToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const checkoutData = await checkoutRes.json().catch(() => ({}));
    console.log("Checkout response:", checkoutRes.status, checkoutData);

    if (!checkoutRes.ok || checkoutData.success === false) {
      throw new Error(
        checkoutData.error || checkoutData.message || "Payment failed",
      );
    }

    const url = checkoutData.url || checkoutData.checkoutUrl;
    if (url) {
      // Redirect to Stripe-hosted checkout
      window.location.href = url;
    } else {
      throw new Error("No checkout URL received");
    }
  } catch (e) {
    console.error("Payment error:", e);
    if (typeof hideLoading === "function") hideLoading();
    if (typeof showToast === "function") {
      showToast(e.message || "Payment failed", "error");
    }
  }
}

/**
 * refreshBalance
 * - Calls /api/credits
 * - Expects { success, balance: { wallet, videos } }
 * - Updates appState.userBalance and UI
 */
async function refreshBalance() {
  if (!appState.authToken) return;

  try {
    const res = await fetch(`${API_BASE}/api/credits`, {
      headers: { Authorization: `Bearer ${appState.authToken}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      console.error(
        "Credits fetch error:",
        data.error || data.message,
      );
      return;
    }

    const walletBalance = Number(data.balance?.wallet ?? 0);
    appState.userBalance = Number.isFinite(walletBalance)
      ? walletBalance
      : 0;

    if (typeof updateBalanceDisplay === "function") {
      updateBalanceDisplay();
    }
  } catch (e) {
    console.error("Balance refresh failed:", e);
  }
}

/**
 * Stripe return handler
 * - On DOMContentLoaded, checks for session_id or ?payment=...
 * - If session id present, verifies via /api/credits/checkout/verify
 * - On success, shows toast and refreshes balance
 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  // successUrl: .../wallet?session_id={CHECKOUT_SESSION_ID}
  const sessionId = params.get("session_id");
  const statusFlag = params.get("payment"); // ?payment=success|cancelled

  // If we have a Stripe session id, verify with backend
  if (sessionId) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (appState.authToken) {
        headers.Authorization = `Bearer ${appState.authToken}`;
      }

      const verifyRes = await fetch(
        `${API_BASE}/api/credits/checkout/verify`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ sessionId }),
        },
      );

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || verifyData.success === false) {
        if (typeof showToast === "function") {
          showToast(
            verifyData.error || "Payment verification failed",
            "error",
          );
        }
      } else {
        if (typeof showToast === "function") {
          showToast(
            "Payment successful! Credits added to your wallet.",
            "success",
          );
        }
        await refreshBalance();
      }
    } catch (e) {
      console.error("Payment verification error:", e);
      if (typeof showToast === "function") {
        showToast("Could not verify payment.", "error");
      }
    }

    // Clean Stripe params from URL
    window.history.replaceState({}, "", window.location.pathname);
    return;
  }

  // Fallback: simple ?payment=success|cancelled flag
  if (statusFlag === "success") {
    if (typeof showToast === "function") {
      showToast("Payment successful!", "success");
    }
    refreshBalance();
  } else if (statusFlag === "cancelled") {
    if (typeof showToast === "function") {
      showToast("Payment cancelled", "info");
    }
  }

  window.history.replaceState({}, "", window.location.pathname);
});

// Expose functions if needed elsewhere
window.processPayment = processPayment;
window.refreshBalance = refreshBalance;
