<?php
define('API_KEY', 'stp_8c391608fc688dbb1028ce30bfc9a9e86ccd8d6983a769f6');
define('API_URL', 'https://sastaotp.com/stubs/handler_api.php');

function apiRequest($params) {
    $params['api_key'] = API_KEY;
    $params['format'] = 'json';
    
    $url = API_URL . '?' . http_build_query($params);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['status' => 'ERROR', 'error' => $error];
    }
    
    return json_decode($response, true);
}

function getBalance() {
    $result = apiRequest(['action' => 'getBalance']);
    return $result['balance'] ?? 0;
}

function getServices() {
    $result = apiRequest(['action' => 'getServicesList']);
    return $result['services'] ?? [];
}

function buyNumber($service, $country = '91') {
    $result = apiRequest([
        'action' => 'getNumber',
        'service' => $service,
        'country' => $country
    ]);
    
    if ($result['status'] == 'OK') {
        return [
            'success' => true,
            'activation_id' => $result['activation_id'],
            'number' => $result['number'],
            'price' => $result['price']
        ];
    }
    return ['success' => false, 'error' => $result['status'] ?? 'Unknown error'];
}

function checkOTP($activationId) {
    $result = apiRequest([
        'action' => 'getStatus',
        'id' => $activationId
    ]);
    
    if (isset($result['sms']['code'])) {
        return ['success' => true, 'code' => $result['sms']['code']];
    }
    
    if (isset($result['raw']) && strpos($result['raw'], 'STATUS_OK:') !== false) {
        $code = explode(':', $result['raw'])[1];
        return ['success' => true, 'code' => $code];
    }
    
    return ['success' => false];
}

function cancelOrder($activationId) {
    return apiRequest([
        'action' => 'setStatus',
        'id' => $activationId,
        'status' => 8
    ]);
}

function completeOrder($activationId) {
    return apiRequest([
        'action' => 'setStatus',
        'id' => $activationId,
        'status' => 6
    ]);
}
?>