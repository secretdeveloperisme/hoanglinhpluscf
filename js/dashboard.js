import { makeHttpRequest, showToast } from "./common.js"
import { TableRenderer } from "../assets/libs/table_renderer_v1.0.0.es.js";
const POSTS_API_URL = "/api/posts.php";

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

    let firstLoads = {
        users: true,
        posts: true,
        quotes: true,
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    sidebarLinks.forEach(async (link) => {
        link.addEventListener('click', async (event) => {

            const targetId = event.currentTarget.dataset.target;
            const targetSection = document.getElementById(targetId);

            if (targetSection) {

                document.querySelector('.sidebar-nav a.active').classList.remove('active');
                event.currentTarget.classList.add('active');

                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                targetSection.classList.add('active');
                switch (targetId) {
                    case "usersSection":
                        openUsersManagement();
                        firstLoads.users = false;
                        break;
                    case "postsSection":
                        openPostsManagement();
                        firstLoads.posts = false;
                        break;
                    case "quotesSection":
                        await openQuotesManagement();
                        firstLoads.quotes = false;
                        break;
                    default:
                        break;
                }
            }
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
    function openUsersManagement() {
        if (!firstLoads.users) {
            return;
        }

    }

    function openPostsManagement() {
        if (!firstLoads.posts) {
            return;
        }

        const tableColumns = [
            { key: 'post_id', label: 'ID', type: 'number', sortable: true },
            {
                key: 'title', label: 'Title', type: 'text', sortable: true, width: "400px",
                formatter: (title, row) => {
                    return `<a class="text-underline" href="/pages/post_detail.html?id=${row.post_id}" target="_blank">${title}</a>`
                }
            },
            {
                key: 'description', label: 'description', type: 'text', width: "500px",
                formatter: (description, _) => {
                    return `<span class="text-truncate-2-lines" tooltip="${description}">${description}</span>`
                }
            },
            {
                key: 'post_status', label: 'Status', type: 'text', sortable: true,
                formatter: (post_status, _) => {
                    if (!post_status) {
                        return `<span class="warning-pill">Unknown</span>`;
                    }
                    let statusClass = post_status.toLocaleLowerCase() === 'published' ? 'success-pill' : 'warning-pill';
                    return `<span class="${statusClass}">${post_status}</span>`
                }
            },
            { key: 'created_at', label: 'Created At', type: 'date', sortable: true },
        ];

        const postsTable = new TableRenderer({
            title: 'Posts Table',
            idKeyName: 'post_id',
            targetWrapperElementId: 'tableContainer',
            columns: tableColumns,
            pagination: {
                itemsPerPage: 5
            },
            customDataHandler: loadPostsData,
            deleteSingleRowHandler,
            updateRowHandler: myCustomUpdateRowHandler,
            addRowHandler: myCustomAddHandler,
        });
        console.log(postsTable);
        try {
            postsTable._fetchAndRenderData();
        }
        catch (error) {
            console.error("Error during table initialization or data loading:", error);
        }

    }

    async function openQuotesManagement() {
        if (!firstLoads.quotes) {
            return;
        }
    }
    async function getPostsFromServer(page, itemsPerPage, sortColumn, sortDirection) {
        let request_posts_url = new URLSearchParams();
        request_posts_url.set('page', page);
        request_posts_url.set('limit', itemsPerPage);
        request_posts_url.set('sort', sortColumn);
        request_posts_url.set('direction', sortDirection);

        let response = await makeHttpRequest("GET", `${POSTS_API_URL}?${request_posts_url.toString()}`);
        return response || {};
    }
    async function loadPostsData(options) {
        console.log("Custom Data Handler called with options:", options);
        const { page, itemsPerPage, sortColumn, sortDirection } = options;
        let posts = await getPostsFromServer(page, itemsPerPage, sortColumn, sortDirection);
        let filteredAndSortedData = [...posts?.data || []];
        if (sortColumn && sortDirection) {

        }
        const total = posts.paging?.total;
        const totalPages = posts.paging?.pages;

        return {
            data: filteredAndSortedData,
            totalItems: total,
            totalPages
        };
    }

    async function deleteSingleRowHandler(id) {
        console.log("Custom Delete Handler called for ID:", id);
        let delete_post_params = new URLSearchParams({
            action: 'delete',
            isHard: false,
            id
        });
        let response = await makeHttpRequest("POST", `${POSTS_API_URL}?${delete_post_params.toString()}`);
        if (response) {
            showToast("success", "Delete Post", "Post deleted successfully!");
        } else {
            showToast("error", "Delete Post", "Failed to delete post. Please try again.");
        }
    }

    function myCustomAddHandler() {
        window.location.href = `/pages/create_post.html`;
    }

    async function myCustomUpdateRowHandler(idToUpdate, row) {
        window.location.href = `/pages/edit_post.html?id=${idToUpdate}`;
    }
});