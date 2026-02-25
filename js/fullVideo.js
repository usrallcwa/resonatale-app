// fullVideo.js

// Start a 1-minute paid movie
async function startMovie(prompt) {
  if (!window.appState || !window.API_BASE) {
    throw new Error("App not initialized");
  }

  const { appState } = window;
  const API_BASE = window.API_BASE;

  if (!appState.authToken) {
    throw new Error("Please log in before creating a movie");
  }

  const res = await fetch(`${API_BASE}/api/render/movie`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appState.authToken}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    if (data.code === "INSUFFICIENT_BALANCE") {
      throw new Error(
        "You don’t have enough balance. Please top up your wallet.",
      );
    }
    throw new Error(
      data.error || data.message || "Failed to start movie",
    );
  }

  return data.projectId;
}

// Poll movie project until ready (for now, just script or final video URL)
async function pollMovieProject(projectId) {
  const API_BASE = window.API_BASE;

  const poll = async () => {
    const res = await fetch(`${API_BASE}/api/render/movie/${projectId}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      if (typeof window.hideLoading === "function") window.hideLoading();
      if (typeof window.showToast === "function") {
        window.showToast(
          data.error || data.message || "Failed to load movie",
          "error",
        );
      }
      return;
    }

    const project = data.project || {};
    const status = project.status;

    // Later: when you fill audio_url, scene_video_urls, final_video_url,
    // you can use those. For now, just wait for finalVideoUrl if present.
    if (project.finalVideoUrl) {
      if (typeof window.hideLoading === "function") window.hideLoading();

      const mediaEl = document.getElementById("previewVideo");
      if (mediaEl) {
        mediaEl.src = project.finalVideoUrl;
      }

      if (typeof window.showToast === "function") {
        window.showToast("Your 1-minute movie is ready!", "success");
      }
    } else if (status === "ERROR") {
      if (typeof window.hideLoading === "function") window.hideLoading();
      if (typeof window.showToast === "function") {
        window.showToast(
          project.lastError || "Movie failed.",
          "error",
        );
      }
    } else {
      setTimeout(poll, 4000);
    }
  };

  poll();
}

// Click handler for "Make my 1-minute movie"
async function onCreateMovieClicked() {
  const briefDescEl = document.getElementById("briefDesc");
  const prompt = briefDescEl ? briefDescEl.value.trim() : "";

  if (!prompt) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Please enter what you want your 1-minute movie to be about.",
        "error",
      );
    }
    return;
  }

  try {
    if (typeof window.showLoading === "function") {
      window.showLoading("Creating your 1-minute movie...");
    }

    const projectId = await startMovie(prompt);

    if (typeof window.showToast === "function") {
      window.showToast(
        "Movie created. We’ll notify you when it’s ready.",
        "success",
      );
    }

    await pollMovieProject(projectId);
  } catch (err) {
    console.error("Create movie error:", err);
    if (typeof window.hideLoading === "function") window.hideLoading();
    if (typeof window.showToast === "function") {
      window.showToast(
        err.message || "Failed to create movie",
        "error",
      );
    } else {
      alert(err.message || "Failed to create movie");
    }
  }
}

window.onCreateMovieClicked = onCreateMovieClicked;
window.startMovie = startMovie;
window.pollMovieProject = pollMovieProject;
