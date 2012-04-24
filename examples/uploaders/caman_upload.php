<?
/*
 * An example PHP upload script for CamanJS. This expects a base64
 * encoded string which represents the modified image data. It converts
 * it back to binary and saves it to a file.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

define('UPLOAD_PATH', 'uploads/');

if (!$_POST['photo']) { exit; }

$image = process_image($_POST['photo']);
if (!$image) { exit; }

// Just use a unique ID for the filename for this example
$filename = uniqid() . '.' . $image['type'];

if (is_writable(UPLOAD_PATH) && !file_exists(UPLOAD_PATH . $filename)) {
	if (file_put_contents(UPLOAD_PATH . $filename, $image['data']) !== false) {
		echo "1";
	} else {
		echo "0";
	}
} else {
	echo "0";
}

// Processes the encoded image data and returns the decoded image
function process_image($photo) {
	$type = null;
	if (preg_match('/^data:image\/(jpg|jpeg|png)/i', $photo, $matches)) {
		$type = $matches[1];
	} else {
		return false;
	}
	
	// Remove the mime-type header
	$data = reset(array_reverse(explode('base64,', $photo)));
	
	// Use strict mode to prevent characters from outside the base64 range
	$image = base64_decode($data, true);
	
	if (!$image) { return false; }
	
	return array(
		'data' => $image,
		'type' => $type
	);
}