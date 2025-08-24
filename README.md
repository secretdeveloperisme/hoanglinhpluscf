# Hoang Linh Plus's Website

![First Into Website](/assets/images/readme/First_Into_Website.png)

This project is a pure PHP website (no framework) for sharing my background, skills, experience and knowledge. it was built entirely from scratch out of my passion for web development and a desire to deeply understand the backbone of how websites work. By creating everything myself, I learned the fundamentals of backend logic, front end design, responsive, authentication, post management, file handling, and modular code organization.

## Technologies

- **Backend:** PHP, MariaDB
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** JWT (JSON Web Token)
- **File Storage:** Local file system (uploads, temp)
- **Logging:** Custom logger with file rotation
- **Other:** RESTful API, MVC-inspired structure


## Getting Started
 

### Prerequisites

You will need a local web server environment with the following:

*   [PHP](https://www.php.net/downloads.php)
*   [MariaDB](https://mariadb.org/download/) or [MySQL](https://www.mysql.com/downloads/)
*   A web server like [Apache](https://httpd.apache.org/) or [Nginx](https://www.nginx.com/)
*   (Optional) A tool like [XAMPP](https://www.apachefriends.org/index.html) which bundles all of the above.

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/secretdeveloperisme/hoanglinhpluscf
    cd hoanglinhpluscf
    ```

2. **Database Setup:**
    *   Start your MariaDB/MySQL server.
    *   Create a new database.
    *   Import the database structure by executing the `database/structure.sql` file. You can use a database management tool like phpMyAdmin or the command line.
      ```bash
      mysql -u your_username -p your_database_name < database/structure.sql
      ```

3. **Environment Configuration:**
    *   Create a `.env` file in the root directory by copying the example file:
      ```bash
      cp .env.example .env
      ```
    *   Open the `.env` file and update the following variables with your database credentials:
      ```dotenv
      DB.HOST=localhost
      DB.USERNAME=your_db_user
      DB.PASSWORD=your_db_password
      DB.NAME=your_db_name
      DB.PORT=3306
      ```

4. **Run the application:**
    *   Place the project folder in your web server's document root (e.g., `htdocs` for XAMPP).
    *   Start MariaDB and PHP Server
    *   Open your web browser and navigate to the project's URL (e.g., `http://localhost/hoanglinhpluscf`).

---

Hosting website: [www.hoanglinhplus.cf](https://hoanglinhplus.orgfree.com)
