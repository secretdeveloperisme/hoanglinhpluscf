import { initPostTable } from "./post_management.js";
import { getLoginUser, verifyAdminAccess } from "./auth.js";
import { HttpReponseErr } from "./common.js";

document.addEventListener('DOMContentLoaded', async () => {
  let user = null;
  try {
    user = await getLoginUser();
  } catch (e) {
    if (e instanceof HttpReponseErr) {
      if (e.status === 401) {
        window.location.href = "/pages/login.html?redirect=/pages/my_posts.html";
        return;
      }
    }
  }
  if (!user) {
    window.location.href = "/pages/login.html?redirect=/pages/my_posts.html";
    return;
  }

  initPostTable({
    targetWrapperElementId: 'tableMyPostsContainer',
    isAdmin: false,
    userId: user.id,
  });
});
