<?php
// Set this to true if you want to be able to load images from a url that doesn't
// end in an image file extension. E.g. through another proxy of kinds.
define('ALLOW_NO_EXT', false);

$proxyParam = 'camanProxyUrl';

if (!$_GET[$proxyParam]) {
  exit;
}

// Grab the URL
$url = trim(urldecode($_GET[$proxyParam]));

$urlinfo = parse_url($url, PHP_URL_PATH);
$ext = array_reverse(explode(".", $urlinfo));

$ctype = null;
switch ($ext[0]) {
case 'gif': $ctype = 'image/gif'; break;
case 'png': $ctype = 'image/png'; break;
case 'jpeg':
case 'jpg': $ctype = 'image/jpg'; break;
default:
  if (ALLOW_NO_EXT) {
    $ctype = 'application/octet-stream';
  } else {
    exit;
  }
}


// Route the image through this script
header("Content-Type: $ctype");
readfile($url);