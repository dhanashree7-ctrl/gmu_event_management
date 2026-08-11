<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$input = '{"event_id": 1207}';
file_put_contents('php://memory', $input);

// Hack to override php://input
class stream {
    private $position;
    private $string;
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->string = '{"event_id": 1207}';
        $this->position = 0;
        return true;
    }
    public function stream_read($count) {
        $ret = substr($this->string, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }
    public function stream_eof() {
        return $this->position >= strlen($this->string);
    }
    public function stream_stat() {
        return array();
    }
}
stream_wrapper_unregister("php");
stream_wrapper_register("php", "stream");

require 'C:\Event Management\backend\get_attendee_roster.php';
