<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->username) &&
    !empty($data->current_password) &&
    !empty($data->new_password)
) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Check current password
        $query = "SELECT password FROM users WHERE username = :username";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($data->current_password, $row['password'])) {
                // Update password
                $new_hash = password_hash($data->new_password, PASSWORD_BCRYPT);
                $update_query = "UPDATE users SET password = :new_password WHERE username = :username";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(':new_password', $new_hash);
                $update_stmt->bindParam(':username', $data->username);
                
                if ($update_stmt->execute()) {
                    echo json_encode(["success" => true, "message" => "Password updated successfully."]);
                } else {
                    echo json_encode(["success" => false, "message" => "Failed to update password."]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "User not found."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
}
?>
