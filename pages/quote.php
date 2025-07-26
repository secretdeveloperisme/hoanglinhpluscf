<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotes</title>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/quote.css">
    <script src="../js/quote.js"></script>
</head>

<body>
    <div class="header">
        <h1 class="header__title">Good quotes</h1>
    </div>
    <div class="display">
        <p class="display__quote">Life is like ridding a bicycle. To keep your balance, you must keep moving.</p>
        <p class="display__author">-Albert Einstein</p>
    </div>
    <div class="modal">
        <div class="modal__overlay"></div>
        <div class="modal__body">
            <div class="input-quote">
                <h2 class="input__title">Add A Quote</h2>
                <div class="input__content">
                    <span class="input__label">Content:</span>
                    <input type="text" name="inputContent" class="input__content-text" placeholder="input a quote content">
                </div>
                <div class="input__content">
                    <span class="input__label">Author</span>
                    <input type="text" name="inputAuthor" class="input__content-text" placeholder="input a quote author">
                </div>
                <div class="input-btn-group">
                    <button class="input__add">ADD</button>
                    <button class="input__add input__quick-add">Quick Add</button>
                </div>
            </div>
        </div>
        <div class="modal__close">
            &times;
        </div>
    </div>
    <div class="darkmode">
        <div class="switch">
            <input type="checkbox" checked>
            <span class="slider round"></span>
        </div>
    </div>
    <script>
        <?php
        $quoteWebsiteURL = "https://www.quotationspage.com/qotd.html";
        $ch = curl_init();

        // Set the URL to fetch data from
        curl_setopt($ch, CURLOPT_URL, $quoteWebsiteURL);

        // Set options to return the transfer as a string
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            "Accept: */*",
            "Accept-Language: en-US,en;q=0.5",
            "Connection: keep-alive",
            "Host: www.quotationspage.com",
            "Upgrade-Insecure-Requests: 1",
        ]);

        // Execute the cURL session
        $response = curl_exec($ch);

        // Check for errors
        if (curl_errno($ch)) {
            echo "cURL Error: " . curl_error($ch);
            exit;
        }

        // Close the cURL session
        curl_close($ch);

        // Ensure UTF-8 and fix broken &
        $html = mb_convert_encoding($response, 'HTML-ENTITIES', 'UTF-8');
        $html = preg_replace('/&(?![a-zA-Z0-9#]+;)/', '&amp;', $html);
        // Parse the XML response
        // $xml = simplexml_load_string($response, "SimpleXMLElement", LIBXML_NOWARNING);

        $doc = new DOMDocument();
        libxml_use_internal_errors(true);

        $doc->loadHTML($html);
        $xpath = new DOMXPath($doc);

        $quoteContainerResult = $xpath->query('//*[@id="content"]/dl');
        if ($quoteContainerResult != null && $quoteContainerResult->length > 0) {

            $quotesContainer = $quoteContainerResult->item(0);

            $quoteContentNodes = $quotesContainer->getElementsByTagName('dt');
            $quoteAuthorNodes = $quotesContainer->getElementsByTagName('dd');

            if ($quoteContentNodes->length != $quoteAuthorNodes->length) {
                echo "console.log('Error: Mismatched quote and author count');";
                exit;
            }
            $quoteArr = [];

            for ($i = 0; $i < $quoteContentNodes->length; $i++) {
                $quote = $quoteContentNodes->item($i)->nodeValue;
                $author = $quoteAuthorNodes->item($i)->childNodes->item(1)->nodeValue;
                $quoteObj = array(
                    'content' => $quote,
                    'author' => $author
                );
                array_push($quoteArr, $quoteObj);
            }
            echo "const quotes = " . json_encode($quoteArr) . ";";
            echo "console.log(quotes);";
        }
        // Example: Accessing data from the XML
        // echo $xml;

        ?>
    </script>

</body>

</html>