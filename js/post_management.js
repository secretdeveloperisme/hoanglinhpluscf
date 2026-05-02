import { makeHttpRequest, showToast } from "./common.js";
import { TableRenderer } from "../assets/libs/table_renderer_v1.0.0.es.js";

export function initPostTable({
  targetWrapperElementId,
  apiUrl = "/api/posts.php",
  isAdmin = false,
  userId = null,
  addHandler = null,
  updateHandler = null,
  deleteHandler = null,
  itemsPerPage = 5,
}) {
  const tableColumns = [
    { key: 'post_id', label: 'ID', type: 'number', sortable: true, center: true },
    {
      key: 'title', label: 'Title', type: 'text', sortable: true, width: "400px",
      formatter: (title, row) => {
        return `<a class="text-underline" href="/pages/post_detail.html?id=${row.post_id}" target="_blank">${title}</a>`;
      }
    },
    {
      key: 'description', label: 'Description', type: 'text', width: "500px",
      formatter: (description, _) => {
        return `<span class="text-truncate-2-lines" tooltip="${description}">${description}</span>`;
      }
    },
    {
      key: 'post_status', label: 'Status', type: 'text', sortable: true, center: true,
      formatter: (post_status, _) => {
        if (!post_status) {
          return `<span class="warning-pill">Unknown</span>`;
        }
        let statusClass = post_status.toLocaleLowerCase() === 'published' ? 'success-pill' : 'warning-pill';
        return `<span class="${statusClass}">${post_status}</span>`;
      }
    },
    { key: 'created_at', label: 'Created At', type: 'date', sortable: true, center: true },
  ];

  if(isAdmin){
    tableColumns.push({
      key: 'deleted_at', label: 'Deleted At', type: 'date', sortable: true, center: true,
      formatter: (deleted_at, _) => {
        if (!deleted_at) {
          return `<span class="success-pill">Active</span>`;
        }
        return `<span class="danger-pill">Deleted</span>`;
      }
    })
  }

  async function getPostsFromServer(page, itemsPerPage, sortColumn, sortDirection) {
    let request_posts_url = new URLSearchParams();
    request_posts_url.set('page', page);
    request_posts_url.set('limit', itemsPerPage);
    request_posts_url.set('sort', sortColumn);
    request_posts_url.set('direction', sortDirection);
    if (isAdmin) {
      request_posts_url.set('get_all_for', 'admin_manage');
    } else{
      request_posts_url.set('get_all_for', 'user_manage');
    }
    try {
      let response = await makeHttpRequest("GET", `${apiUrl}?${request_posts_url.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get posts: ", error);
      return { posts: [], paging: { total: 0, pages: 1 } };
    }
  }

  async function loadPostsData(options) {
    const { page, itemsPerPage, sortColumn, sortDirection } = options;
    let postsRes = await getPostsFromServer(page, itemsPerPage, sortColumn, sortDirection);
    let filteredAndSortedData = [...postsRes.posts];
    const total = postsRes.paging?.total;
    const totalPages = postsRes.paging?.pages;
    return {
      data: filteredAndSortedData,
      totalItems: total,
      totalPages
    };
  }

  async function defaultDeleteHandler(id) {
    let delete_post_params = new URLSearchParams({
      action: 'delete',
      isHard: isAdmin? 'true' : 'false',
      id
    });
    try {
      await makeHttpRequest("POST", `${apiUrl}?${delete_post_params.toString()}`);
      showToast("success", "Delete Post", "Post deleted successfully!");
    } catch (error) {
      showToast("error", "Delete Post", "Failed to delete post. Please try again.");
    }
  }

  function defaultAddHandler() {
    window.location.href = `/pages/create_post.html`;
  }

  function defaultUpdateHandler(idToUpdate, row) {
    window.open(`/pages/edit_post.html?id=${idToUpdate}`, '_blank').focus();
  }

  const postsTable = new TableRenderer({
    title: isAdmin ? 'Posts Table' : 'My Posts',
    idKeyName: 'post_id',
    targetWrapperElementId,
    columns: tableColumns,
    pagination: {
      itemsPerPage
    },
    customDataHandler: loadPostsData,
    deleteSingleRowHandler: deleteHandler || defaultDeleteHandler,
    updateRowHandler: updateHandler || defaultUpdateHandler,
    addRowHandler: addHandler || defaultAddHandler,
  });

  try {
    postsTable._fetchAndRenderData();
  } catch (error) {
    console.error("Error during table initialization or data loading:", error);
  }

  return postsTable;
}
