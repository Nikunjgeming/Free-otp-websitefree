<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

session_start();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    case 'getBalance':
        $balance = getBalance();
        echo json_encode(['success' => true, 'balance' => $balance]);
        break;
        
    case 'getServices':
        $services = getServices();
        $formatted = [];
        foreach($services as $code => $info) {
            if ($info['available'] > 0) {
                $formatted[] = [
                    'code' => $code,
                    'name' => $info['name'],
                    'price' => $info['price'],
                    'available' => $info['available'],
                    'desc' => $info['name'] . ' OTP verification'
                ];
            }
        }
        echo json_encode(['success' => true, 'services' => $formatted]);
        break;
        
    case 'buyNumber':
        $service = $_GET['service'] ?? '';
        $country = $_GET['country'] ?? '91';
        
        if (empty($service)) {
            echo json_encode(['success' => false, 'error' => 'Service required']);
            break;
        }
        
        $result = buyNumber($service, $country);
        
        if ($result['success']) {
            if (!isset($_SESSION['orders'])) {
                $_SESSION['orders'] = [];
            }
            $_SESSION['orders'][] = [
                'id' => $result['activation_id'],
                'number' => $result['number'],
                'price' => $result['price'],
                'time' => time()
            ];
        }
        
        echo json_encode($result);
        break;
        
    case 'checkOTP':
        $activationId = $_GET['id'] ?? '';
        $result = checkOTP($activationId);
        
        if ($result['success']) {
            completeOrder($activationId);
        }
        
        echo json_encode($result);
        break;
        
    case 'cancelOrder':
        $activationId = $_GET['id'] ?? '';
        cancelOrder($activationId);
        echo json_encode(['success' => true]);
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
?>