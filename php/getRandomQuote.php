<?php
  require "ConnectDB.php";
  $connect = getConnectDB();
  $lengthOfQuotesQuery = "SELECT COUNT(id) as length_of_quotes FROM quotes";
  $result = $connect->query($lengthOfQuotesQuery);
  if($result->num_rows > 0){
    $lengthOfQuotes = intval($result->fetch_assoc()["length_of_quotes"]);
  }
  $randomNumberQuote = random_int(0,$lengthOfQuotes-1);
  $randomQuoteQuery = "SELECT * FROM quotes LIMIT $randomNumberQuote,1";
  $quoteResult = $connect->query($randomQuoteQuery);
  $quote = array();
  if($result->num_rows > 0){
    $row = $quoteResult->fetch_assoc();
    $quote["content"] = $row["content"];
    $quote["author"] = $row["author"];
  }
  echo json_encode($quote);

?>