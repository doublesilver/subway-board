-- 1-9호선 외 특수 노선 삭제 (CASCADE로 관련 게시글/댓글도 함께 삭제)
DELETE FROM subway_lines
WHERE line_number NOT IN ('1', '2', '3', '4', '5', '6', '7', '8', '9');
