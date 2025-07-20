import { makeHttpRequest, showToast } from "./common.js"
import { TableRenderer } from "../assets/libs/table_renderer_v1.0.0.es.js";
const USERS_API_URL = "/api/users.php";
const POSTS_API_URL = "/api/posts.php";
const QUOTES_API_URL = "/api/quotes.php";

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

    openUsersManagement();
    function openUsersManagement() {
        if (!firstLoads.users) {
            return;
        }

        const tableColumns = [
            { key: 'id', label: 'ID', type: 'number', sortable: true },
            {
                key: 'username', label: 'USERNAME', type: 'text', sortable: true, 
            },
            {
                key: 'role', label: 'ROLE', type: 'text', 
                formatter: (role, _) => {
                    if (!role) {
                        return `<span class="warning-pill">Unknown</span>`;
                    }
                    let roleClass = role.toLocaleLowerCase() === 'admin' ? 'warning-pill' : 'success-pill';
                    return `<span class="${roleClass}">${role}</span>`;
                }
            },
            {
                key: 'email', label: 'EMAIL', type: 'text', sortable: true, 
            }
        ];

        const postsTable = new TableRenderer({
            title: 'Users Table',
            targetWrapperElementId: 'tableUsersContainer',
            columns: tableColumns,
            pagination: {
                itemsPerPage: 5
            },
            customDataHandler: loadUsersData,
            deleteSingleRowHandler: deleteSingleUserHandler,
        });
        console.log(postsTable);
        try {
            postsTable._fetchAndRenderData();
        }
        catch (error) {
            console.error("Error during table initialization or data loading:", error);
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
        const tableColumns = [
            { key: 'id', label: 'ID', type: 'number', sortable: true },
            {
                key: 'content', label: 'CONTENT', type: 'text', sortable: true, 
            },
            {
                key: 'created_at', label: 'CREATED_AT', type: 'text', sortable: true, 
            }
        ];

        const postsTable = new TableRenderer({
            title: 'Quotes Table',
            targetWrapperElementId: 'tableQuotesContainer',
            columns: tableColumns,
            pagination: {
                itemsPerPage: 5
            },
            customDataHandler: loadQuotesData,
            deleteSingleRowHandler: deleteSingleQuoteHandler,
        });
        console.log(postsTable);
        try {
            postsTable._fetchAndRenderData();
        }
        catch (error) {
            console.error("Error during table initialization or data loading:", error);
        }
    }

    async function getUsersFromServer(page, itemsPerPage, sortColumn, sortDirection) {
        let request_users_url = new URLSearchParams();
        request_users_url.set('page', page);
        request_users_url.set('limit', itemsPerPage);
        request_users_url.set('sort', sortColumn);
        request_users_url.set('direction', sortDirection);

        let response = await makeHttpRequest("GET", `${USERS_API_URL}?${request_users_url.toString()}`);
        return response || {};
    }
    async function loadUsersData(options) {
        const { page, itemsPerPage, sortColumn, sortDirection } = options;
        let users = await getUsersFromServer(page, itemsPerPage, sortColumn, sortDirection);
        let filteredAndSortedData = [...users?.data || []];
        if (sortColumn && sortDirection) {

        }
        const total = users.paging?.total;
        const totalPages = users.paging?.pages;

        return {
            data: filteredAndSortedData,
            totalItems: total,
            totalPages
        };
    }

    async function deleteSingleUserHandler(id) {
        let delete_user_params = new URLSearchParams({
            action: 'delete',
            id
        });
        let response = await makeHttpRequest("POST", `${USERS_API_URL}?${delete_user_params.toString()}`);
        if (response) {
            showToast("success", "Delete User", "User deleted successfully!");
        } else {
            showToast("error", "Delete User", "Failed to delete User. Please try again.");
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



    async function getQuotesFromServer(page, itemsPerPage, sortColumn, sortDirection) {
        let request_quotes_url = new URLSearchParams();
        request_quotes_url.set('page', page);
        request_quotes_url.set('limit', itemsPerPage);
        request_quotes_url.set('sort', sortColumn);
        request_quotes_url.set('direction', sortDirection);

        let response = await makeHttpRequest("GET", `${QUOTES_API_URL}?${request_quotes_url.toString()}`);
        return response || {};
    }
    async function loadQuotesData(options) {
        console.log("Custom Data Handler called with options:", options);
        const { page, itemsPerPage, sortColumn, sortDirection } = options;
        let quotes = await getQuotesFromServer(page, itemsPerPage, sortColumn, sortDirection);
        let filteredAndSortedData = [...quotes?.data || []];
        if (sortColumn && sortDirection) {

        }
        const total = quotes.paging?.total;
        const totalPages = quotes.paging?.pages;

        return {
            data: filteredAndSortedData,
            totalItems: total,
            totalPages
        };
    }

    async function deleteSingleQuoteHandler(id) {
        let delete_quote_params = new URLSearchParams({
            action: 'delete',
            id
        });
        let response = await makeHttpRequest("POST", `${QUOTES_API_URL}?${delete_quote_params.toString()}`);
        if (response) {
            showToast("success", "Delete Quote", "Quote deleted successfully!");
        } else {
            showToast("error", "Delete Quote", "Failed to delete Quote. Please try again.");
        }
    }

});