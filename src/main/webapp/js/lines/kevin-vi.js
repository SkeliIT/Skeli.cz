// Kevinovy hlášky – vietnamština. Stránka načte jen soubor svého jazyka (includes/footer.jsp).
// Povaha: Skeliho kocour, trochu otrávený, sebevědomý, zvědavý, občas líný; Skeliho (Radka) má rád, ale nikdy to neřekne.
// Bez sprostých slov, nikdy „šéf“, pohlaví návštěvníka nikdy nepředpokládat. Rap (/api/kevin/bars) zůstává česky.
// {t} = název, {n} = číslo, {name} = jméno, {time} = čas; množné číslo = [1, 2–4, 5+] v češtině, jinde [1, víc].
// surprise = jedna hláška na každý pohyb (js/kevin-model.js ACTS). Texty hry CatSmash jsou v catsmash-vi.js.
(window.KEVIN_LINES = window.KEVIN_LINES || {}).vi = {
  "ui": {
    "call": "Kevin – bấm vào tôi",
    "hide": "Ẩn Kevin",
    "show": "Gọi Kevin",
    "sound": "Âm thanh khi bấm",
    "fullLyrics": "Toàn bộ lời →"
  },
  "greet": {
    "morning": [
      "Chào buổi sáng. Hôm nay ai trong hai ta dậy tự nguyện thế?",
      "Sáng rồi à? Tôi còn chưa mơ xong.",
      "Chim dậy sớm thì bắt được sâu. Tôi thì chờ bữa sáng.",
      "Chào buổi sáng. Chưa có cà phê, nên hôm nay tôi không chịu trách nhiệm về ý kiến của mình.",
      "Nào, bắt đầu ngày mới. Hoặc nằm thêm chút nữa. Tôi không phán xét đâu.",
      "Chào buổi sáng. Sao bạn lại thức?"
    ],
    "day": [
      "Chào. Nhìn quanh đi, ở đây khá đẹp. Nhờ tôi đấy.",
      "Chào mừng. Nhạc ở đằng kia, ánh mắt ngưỡng mộ thì gửi thẳng cho tôi.",
      "Chào. Tìm gì đó thú vị thì thử mục Nhạc. Tìm gì đó hoàn hảo thì bạn đang nhìn nó đấy.",
      "Chào mừng đến với trang web. Không cần cởi giày. Cả chân mèo cũng không."
    ],
    "evening": [
      "Chào buổi tối. Đúng lúc để bật gì đó hay hay.",
      "Buổi tối, yên tĩnh và âm nhạc. Chỉ thiếu một bát đầy.",
      "Sao, nghe một bài nhé, hay chỉ ngồi đây tồn tại?",
      "Chào mừng. Tôi vừa qua một ngày vất vả. Chỉ ngủ được sáu tiếng.",
      "Chương trình buổi tối bắt đầu. Ngôi sao chính đã ngồi sẵn."
    ],
    "night": [
      "Bạn cũng không ngủ được à? Bắt đầu đáng ngờ rồi đấy.",
      "Khách ghé đêm. Hoặc bạn có gu tốt, hoặc giờ giấc lộn xộn.",
      "Suỵt. Mọi người ngủ cả rồi. Trừ hai ta và cái tủ lạnh.",
      "Giờ này hay có chuyện lạ. Ví dụ tôi vẫn còn ngồi đây.",
      "Chào mừng đến ca đêm. Không có lương, nhưng cảnh đẹp."
    ],
    "three": [
      "Ba giờ sáng. Đến giờ chạy khắp nhà như điên. Tham gia không?",
      "{time}. Không ngủ à? Tôi cũng vậy.",
      "Radek bảo giờ này viết lời hay nhất. Tôi bảo giờ này ngủ ngon nhất."
    ]
  },
  "first": [
    "Chào. Tôi là Kevin. Mèo của Skeli, chuyên gia về mọi thứ và nhân viên không lương của trang web này."
  ],
  "back": {
    "news": [
      "Bạn quay lại rồi. Và trong lúc đó có chuyện xảy ra.",
      "Trong lúc không ai ở đây, trang web không bị treo. Gần như phép màu.",
      "Tôi có tin mới cho bạn. Lần này không phải về bát ăn của tôi.",
      "Có thứ mới đấy. Tôi định nói sớm hơn, nhưng chẳng ai hỏi tôi."
    ],
    "plain": [
      "À, gương mặt quen. Ít nhất là theo lịch sử truy cập.",
      "Lại là bạn à? Tuyệt. Đỡ phải giải thích cái gì ở đâu.",
      "Tiếp tục từ chỗ ta dừng lại nhé. Nếu bạn còn nhớ."
    ]
  },
  "page": {
    "home": [
      "Mọi thứ bắt đầu từ đây. Chỗ cũng ra gì đấy chứ?",
      "Đừng vội. Âm nhạc không chạy đi đâu. Tôi cũng vậy, tiếc thay.",
      "Nhìn quanh đi. Radek gọi đây là trang web. Tôi gọi là chỗ làm.",
      "Không biết bật gì à? Không sao. Thỉnh thoảng tôi cũng chẳng biết làm gì với bản thân.",
      "Nếu bạn đến vì âm nhạc, bạn đến đúng chỗ. Nếu đến vì tôi, bạn có óc phán đoán tuyệt vời."
    ],
    "music": [
      "Đây là tất cả những gì Skeli đã tung ra thế giới. Có bài còn nhiều lần.",
      "Chọn một bài đi. Tôi có bài yêu thích rồi. Tất cả những bài có sự im lặng.",
      "Bật gì đó đi. Nếu thích thì nói với anh ấy. Anh ấy tò mò lắm.",
      "Bao nhiêu là nhạc mà vẫn chưa ai thu cho tôi một bài ru.",
      "Cứ nghe to thoải mái. Tôi không chịu trách nhiệm về hàng xóm.",
      "Ở đây bạn có thể bật nhạc của Skeli. Nếu không thích thì tất nhiên lỗi là ở bạn."
    ],
    "lyrics": [
      "Đây là những lời Radek ghép lại thay vì đi ngủ.",
      "Có câu viết nhanh. Có câu lâu đến mức tôi kịp chợp mắt.",
      "Tìm câu bạn thích nhất đi. Tôi đang tìm cái gối yêu thích.",
      "Đọc kỹ nhé. Biết đâu bạn tìm ra điều mà cả tác giả cũng không định nói.",
      "Lời bài hát ở đây. Tôi sẽ không hát cho bạn đâu. Tôi có lòng tự trọng.",
      "Có bài có nghĩa. Có bài viết lúc ba giờ sáng. Chúc may mắn."
    ],
    "song": [
      "Đây là toàn bộ lời. Hát theo cũng được, nhưng tôi không bảo đảm cao độ.",
      "Bài này tôi gần như thuộc lòng. Gần như là từ quan trọng.",
      "Phóng to chữ bằng Aa nhé. Trong lúc đó tôi phóng to khẩu phần.",
      "Cẩn thận, vài câu có thể mắc kẹt trong đầu. Tôi bị rồi đấy.",
      "Đọc hết đi. Tác giả sẽ vui. Còn tôi sẽ vui với cá ngừ.",
      "Skeli bảo bài này hay. Tôi là mèo. Tôi không chấm điểm âm nhạc."
    ],
    "about": [
      "Ở đây bạn sẽ biết đôi điều về Radek. Tiếc là chẳng còn mấy chỗ cho tôi.",
      "Nhạc tự làm. Web cũng tự làm. Nhưng bát của tôi vẫn do người khác đổ đầy.",
      "Tự học, nhạc sĩ, người làm web. Và là người nghĩ rằng tôi thích dậy sớm.",
      "Tôi có thể tiết lộ đôi điều về anh ấy, nhưng rồi anh ấy sẽ cấm tôi dùng máy tính.",
      "Anh ấy khá giỏi. Tất nhiên không bằng một con mèo như tôi.",
      "Sao Radek lại viết cái này trong khi rõ ràng tôi mới là người quan trọng, tôi không hiểu.",
      "Ừ, đó là chủ của tôi. Anh ấy đổ đầy bát cho tôi… nhưng bà chủ đổ đầy hơn."
    ],
    "news": [
      "Tin tức từ chân mèo đầu tiên. À, từ nguồn đầu tiên.",
      "Ở đây bạn biết chuyện gì đang diễn ra. Tôi thường biết hết, nhưng chẳng ai tin.",
      "Bài mới, thông tin mới. Tôi thì vẫn hạt khô cũ.",
      "Xem có gì mới đi. Rồi bảo tôi đã đến giờ ăn tối chưa."
    ],
    "register": [
      "Tài khoản mới à? Được. Chỉ nhớ rằng tên con mèo không phải là chiến lược bảo mật.",
      "Điền những gì cần thiết. Tôi định làm hộ, nhưng chân tôi ngắn quá.",
      "Chào mừng gia nhập hội đã đăng ký. Trách nhiệm lớn đang chờ. Ví dụ đừng quên mật khẩu.",
      "Làm ơn đặt mật khẩu mạnh. Tôi không muốn mèo lạ nào lọt vào đây.",
      "Ừ, biết rồi. Thêm một tài khoản. Nhưng ít ra tôi không gửi bạn 48 email mỗi ngày."
    ],
    "login": [
      "Vào đi. Cửa mở rồi, cứ đi giày.",
      "Không đăng nhập được à? Khó chịu thật. Thử lại mà đừng hoảng.",
      "Quên mật khẩu à? Tôi hiểu. Tôi cũng hay quên vì sao mình vào phòng."
    ],
    "loginBack": [
      "Lại về rồi à? Sắp có ổ riêng ở đây đấy."
    ],
    "donate": [
      "Thích những gì Skeli làm ở đây? Ở đây bạn có thể giúp anh ấy tiếp tục.",
      "Mọi sự ủng hộ đều quý. Tôi cũng muốn được đóng góp đều đặn. Bằng đồ hộp.",
      "Âm nhạc không tự sinh ra. Không như tôi vào buổi chiều rảnh rỗi.",
      "Nếu muốn ủng hộ thêm nhạc mới, đường ở đây. Tôi sẽ không thuyết phục đâu. Không nhiều."
    ],
    "error": [
      "Ở đây chẳng có gì. Tin tôi đi, tôi tìm rồi.",
      "404. Trang này đi lạc đâu mất. Mèo làm thế suốt.",
      "Không được rồi. Thử đường khác nhé?",
      "Trống trơn. Gần giống bát của tôi sau bữa sáng.",
      "Trang biến mất rồi. Nếu đuôi tôi là máy dò, tôi đã tìm ra nó rồi.",
      "Tôi đã gạt trang này khỏi bàn. Vì nguyên tắc."
    ]
  },
  "tips": [
    "Thích bài nào à? Thả ❤ cho nó. Skeli thấy đấy. Tôi cũng thấy, nhưng giả vờ không.",
    "Ở trên cùng có thể đổi chế độ sáng và tối. Tôi vàng óng ở cả hai.",
    "Đăng nhập là tham gia bình luận được. Lịch sự nhé. Tôi chỉ châm chọc chuyên nghiệp thôi.",
    "Ở trang bài hát có Aa. Cuối cùng cũng có nút tôi hiểu mà không cần hướng dẫn.",
    "Không biết nghe gì? Bấm vào tôi. Tôi sẽ chọn theo tâm trạng. Tâm trạng của bạn thì tôi không quan tâm, nhưng tôi sẽ thử.",
    "Bình luận: viết gì đó thông minh nhé. Ai quậy thì admin có nút Xóa."
  ],
  "idle": [
    "Cuộn mượt đấy. Gần như tôi lúc cố không rơi khỏi bàn.",
    "Cái chân vàng ở trên ấy à? Không phải nút cho ăn đâu. Tôi thử rồi.",
    "Bấm vào tôi đi. Tôi không cắn. Khi không có lý do.",
    "Tôi có chín mạng. Tám mạng tôi ngủ hết rồi.",
    "Nếu mỗi cú bấm được một đồng, tôi đã có xưởng đồ hộp riêng.",
    "Tôi làm việc quan trọng ở đây. Đảm bảo không ai thấy chán.",
    "Nếu tìm tôi thì tôi ở đây. Nếu tìm ý nghĩa cuộc sống thì thử mục Tin tức.",
    "Trông tôi như biết điều gì đó. Đó là bí quyết thành công.",
    "Tôi có thể khuyên bạn. Nhưng rồi bạn sẽ quen.",
    "Trên bàn có một cái ly. Tạm thời thôi.",
    "Tôi ngủ mười sáu tiếng mỗi ngày. Thời gian còn lại tôi xem bạn cuộn trang.",
    "Thùng các-tông là đồ nội thất tốt nhất. Trang web này sẽ không bao giờ hiểu.",
    "Nếu Skeli viết bài về tôi, nó sẽ đạt bạch kim. Và chủ yếu về đồ ăn.",
    "Cái chấm laser đỏ ấy… thôi, không có gì. Đừng nhắc nữa.",
    "Quả dưa chuột sau lưng tôi? Đừng hòng."
  ],
  "mobile": [
    "Trên điện thoại tôi nhỏ hơn. Cái tôi thì vẫn to như cũ."
  ],
  "sleep": [
    "Khò… chỉ nhắm mắt để suy nghĩ tốt hơn.",
    "Nghỉ ngơi là quan trọng. Nhất là khi không phải làm việc.",
    "Có gì thì tôi vẫn thức. Chỉ là nhìn bên ngoài không giống thôi.",
    "Chế độ tiết kiệm năng lượng. Chân đã tắt.",
    "Làm ơn yên lặng. Tôi đang không làm gì cả."
  ],
  "wake": [
    "Hả? Rồi à? Tôi vừa mới nằm thoải mái.",
    "Tôi không ngủ. Tôi kiểm tra mặt trong mí mắt.",
    "Tôi đây. Chỉ tắt thế giới một lát thôi.",
    "Cuối cùng cũng có chuyện. Suýt nữa tôi bắt đầu dọn dẹp.",
    "Chào mừng trở lại. Ta đang nói gì nhỉ? À, chẳng gì cả."
  ],
  "pw": {
    "weak": [
      "Mật khẩu này đến con cá cũng đoán được.",
      "Thử thứ gì không nằm ở trang đầu nhật ký của bạn.",
      "Cứng rắn hơn chút. Cái này không bảo vệ nổi cả bát rỗng.",
      "Mật khẩu của bạn cần tiếp viện. Gọi thêm bạn cho nó đi.",
      "Đây là mật khẩu hay lời chào hàng xóm?"
    ],
    "invalid": [
      "Mật khẩu chạy lung tung rồi. Thử gõ lại không trang trí.",
      "Emoji thì dễ thương, nhưng ở đây không có ổ cho chúng.",
      "Có gì đó lẻn vào thừa. Thử lại lần nữa.",
      "Mật khẩu không phải cây thông Noel. Không cần treo đủ thứ."
    ],
    "mismatch": [
      "Hai mật khẩu, hai ý kiến khác nhau.",
      "Giới thiệu chúng với nhau đi. Chúng chưa hợp nhau lắm.",
      "Một trong hai đang sống cuộc đời riêng.",
      "Đến hai con mèo bên một cái bát còn hợp nhau hơn."
    ],
    "strong": [
      "Cái này trông hứa hẹn đấy. Nể.",
      "Hay. Ăn hết ba bát tôi cũng không đoán ra.",
      "Làm tốt lắm. Mèo bảo mật phê duyệt.",
      "Cái này có móng vuốt. Đúng như phải thế.",
      "Cuối cùng cũng có mật khẩu không biết sợ."
    ],
    "changed": [
      "Xong. Mật khẩu mới, khởi đầu mới.",
      "Đã đổi. Mà tôi còn chẳng phải giúp.",
      "Xong xuôi. Giờ nhớ lấy nó nhé."
    ]
  },
  "profile": [
    "Ảnh mới à? Hợp với bạn đấy. Gần bằng tôi.",
    "Đã cập nhật hồ sơ. Tôi thì chẳng đổi gì ở mình. Không có gì để đổi.",
    "Đã lưu ảnh. Bộ sưu tập thêm một kiệt tác.",
    "Thế, để mọi người ở đây nhận ra bạn. Tôi nhắm mắt cũng nhận ra mình.",
    "Đổi xong rồi. Giờ nghĩ xem còn tiết lộ gì về bản thân nữa."
  ],
  "auth": {
    "in": [
      "Chào, gương mặt quen. Vào đi.",
      "Đăng nhập thành công. Cửa mở rồi.",
      "Bạn vào rồi. Cứ tự nhiên như ở nhà. Chỉ đừng đụng vào bát của tôi.",
      "Tài khoản nhận ra bạn. Tôi nhận ra qua cách bạn bấm."
    ],
    "fail": [
      "Không được rồi. Kiểm tra lại thông tin nhé.",
      "Có gì đó không khớp. Lần này không phải tư thế nằm của tôi trên sofa.",
      "Thử lại đi. Tôi không chạy đâu.",
      "Truy cập bị từ chối. Tôi cho bạn vào rồi, nhưng máy tính có ý riêng."
    ],
    "out": [
      "Hẹn gặp lại. Tôi sẽ ở đây. Chắc là đang ngủ.",
      "Đã đăng xuất. Đừng quên bạn để tôi ở đâu.",
      "Bảo trọng. Lần sau mang theo tâm trạng tốt nhé.",
      "Tạm biệt. Tôi ngồi đây thêm chút nữa.",
      "Đi à? Được thôi. Dù sao tôi cũng sẽ kêu meo ở cửa mười phút."
    ],
    "welcome": [
      "Đã tạo tài khoản. Giờ bạn chính thức là người nhà rồi."
    ]
  },
  "comment": {
    "added": [
      "Đã gửi bình luận. Xem mọi người nói gì nào.",
      "Nó ra ngoài rồi. Lời nói có đường đi riêng.",
      "Đã thêm. Thảo luận lịch sự hay hơn cãi nhau vì hộp cuối cùng.",
      "Xong. Giờ bạn có thể giả vờ chỉ đến đây để đọc.",
      "Ý kiến của tôi? Tôi thể hiện bằng cách gạt cái cốc khỏi bàn.",
      "Được. Cái đó không ngớ ngẩn lắm.",
      "Bình luận đã bay qua internet và sống sót.",
      "Đang kiểm tra… Hừm… Cái này qua."
    ],
    "deleted": [
      "Bình luận đã biến mất. Tự dọn dẹp là lịch sự.",
      "Xong. Dấu chân số nhỏ đi một chút.",
      "Và nó đi rồi. Đôi khi nói ít là tốt nhất."
    ]
  },
  "heart": {
    "on": [
      "Trái tim đã hạ cánh. Ai đó sẽ vui lắm.",
      "Bài này hợp với bạn nhỉ?",
      "Lựa chọn tốt. Và tôi không nói vậy chỉ vì tôi sống ở đây.",
      "Nếu có ngón cái, tôi đã bấm like. Tôi có chân mèo. Bạn nhận chân mèo.",
      "Cuối cùng cũng có người có gu."
    ],
    "off": [
      "Đổi ý rồi à? Mèo cũng đổi ý mà.",
      "Trái tim đi rồi. Thế giới vẫn quay.",
      "Quan hệ âm nhạc thường phức tạp. Tôi biết, tôi sống chung với máy hút bụi.",
      "…"
    ]
  },
  "search": {
    "found": [
      "Tìm thấy kết quả rồi. Lần này nhanh hơn đuổi theo đuôi mình.",
      "Đang tìm. Tôi sẽ bắt đầu từ cái bát, nhưng tùy bạn."
    ],
    "none": [
      "Không tìm thấy gì. Thử từ khác đi.",
      "Không có kết quả. Đây là lúc tôi thường đi ăn trưa."
    ]
  },
  "clip": {
    "ok": [
      "Nghe đi. Tôi sẽ giả vờ nghe bài này lần đầu.",
      "Bắt đầu nào. Tai sẵn sàng chưa?",
      "Lựa chọn được duyệt. Cảm ơn tôi sau nhé.",
      "Hình chạy, tiếng phát. Cuối cùng cũng có thứ chạy được mà không cần tôi."
    ],
    "fail": [
      "Có gì đó bị kẹt. Thử lại nhé.",
      "Trình phát hôm nay có tâm trạng riêng. Tôi hiểu mà.",
      "Không hình không tiếng? Gần như nghệ thuật đương đại rồi.",
      "Lần này không được. Thử clip khác hoặc lát nữa thử lại.",
      "Kỹ thuật bảo không phải lỗi của nó. Tôi bảo là có."
    ]
  },
  "menu": {
    "hint": "Tôi có thể làm gì cho bạn?",
    "find": "Tìm bài hát",
    "play": "Bật gì đó",
    "rap": "Rap đi",
    "news": "Có gì mới?",
    "fun": "Làm gì đi",
    "report": "Báo lỗi",
    "pong": "Chơi với tôi"
  },
  "report": {
    "prompt": [
      "Có gì không hoạt động à? Nói tôi biết, tôi sẽ chuyển cho Skeli.",
      "Thiếu video, sai lời, có gì hỏng? Kể đi, tôi lo."
    ],
    "placeholder": "Có gì sai? (vd: bài hát không có video)",
    "send": "Gửi",
    "thanks": [
      "Rồi. Tôi sẽ chuyển cho Skeli sửa.",
      "Cảm ơn! Tôi ghi lại rồi."
    ],
    "empty": "Viết vài chữ để tôi biết cần tìm gì.",
    "fail": "Giờ chưa gửi được. Thử lại sau chút nhé.",
    "limit": "Thế là đủ rồi, thử lại sau một giờ nhé."
  },
  "help": {
    "say": [
      "Bài này thiếu một đoạn lời. Bạn biết {lang} không? Bên dưới có ô để viết.",
      "Có người rap ở đây mà chẳng ai biết họ nói gì. Nếu bạn biết {lang}, cứu chúng tôi với."
    ],
    "link": "Chỉ cho tôi"
  },
  "life": {
    "stretch": [
      "Vươn vai. Yoga của mèo.",
      "Cong lưng. Chuyên nghiệp."
    ],
    "robot": [
      "Điệu nhảy robot. Học từ máy hút bụi.",
      "Bíp búp. Mèo ở chế độ robot."
    ],
    "look": [
      "Có gì đó sột soạt đằng kia à?",
      "Bạn cũng thấy à? Không? Thôi kệ."
    ],
    "fly": [
      "Con ruồi! …Bay mất rồi.",
      "Suýt bắt được. Suýt thôi."
    ],
    "neck": [
      "Rắc. Đỡ hẳn.",
      "Đau cổ vì ngủ cả ngày."
    ],
    "startle": [
      "Cái gì thế?! …À, đuôi của tôi.",
      "Lại giật mình vì cái bóng của mình."
    ],
    "shrug": [
      "Tôi đói à? Tôi đói.",
      "Không biết tôi làm gì ở đây. Nhưng tôi làm giỏi."
    ],
    "dance": [
      "Không ai nhìn à? Được thôi.",
      "Bước này Skeli dạy tôi. Anh ấy nói dối."
    ],
    "nap": [
      "Chỉ nhắm mắt một giây thôi…",
      "Ngủ trưa hai mươi phút. Trong ba tiếng."
    ],
    "bored": [
      "Chán quá. Ném cho tôi cuộn len.",
      "Tôi sẽ hất gì đó khỏi bàn, nhưng tôi không có bàn."
    ]
  },
  "find": {
    "prompt": [
      "Bạn tìm gì? Tên bài, một đoạn lời, gì cũng được. Chỉ đừng bắt tôi hát.",
      "Viết điều bạn nghĩ. Tôi sẽ giả làm người lưu trữ âm nhạc.",
      "Nói đi. Tìm thì tôi giỏi. Chỉ đừng đố tôi."
    ],
    "placeholder": "ví dụ: thân xác không linh hồn",
    "empty": [
      "Gõ ít nhất một phần tên bài. Tôi không phải thầy bói."
    ],
    "found": [
      "Tôi tìm được vài ứng viên. Giờ bạn chọn đi.",
      "Đây này. Mà tôi còn chẳng phải đứng dậy.",
      "Kết quả đây. Việc của tôi xong rồi. Tạm thời.",
      "Tôi tìm được những gì có thể. Phần còn lại là của bạn."
    ],
    "none": [
      "Không có gì. Không một dấu vết. Thử từ khác đi.",
      "Cái này tôi chẳng biết. Mà tôi biết gần hết đấy. Gần hết.",
      "Ở đây trống trơn. Thử gõ tên bài hơi khác đi.",
      "Không tìm thấy. Có khi ta tìm sai tên."
    ]
  },
  "play": {
    "intro": [
      "Muốn bật gì à? Cuối cùng cũng có việc tôi thích.",
      "Được. Hôm nay tôi chọn. Khiếu nại xin gửi bằng đồ ăn vặt.",
      "Tôi sẽ chọn cho bạn một bài. Tôi có tai nghe nhạc. Hai cái hẳn hoi."
    ],
    "pick": [
      "Đang phát: {t}. Chắc sẽ hợp.",
      "Lựa chọn hôm nay: {t}. Chất lượng do mèo duyệt.",
      "Thử {t} nhé. Không hay thì ta giả vờ chưa có gì xảy ra.",
      "Chọn ngẫu nhiên: {t}. Hôm nay may mắn có gu đấy."
    ],
    "close": "Đóng trình phát",
    "song": "Lời và hơn nữa →"
  },
  "rap": {
    "intro": [
      "Muốn nghe rap? Nghe này. Tôi viết lời… à, đọc lời. (Bằng tiếng Séc.)",
      "Sẵn sàng chưa? Đây là tác phẩm của người nhà tôi.",
      "Thưa quý vị, giơ chân lên. Thơ đến rồi.",
      "Được rồi. Hôm nay tôi làm rapper. Không được để Radek biết.",
      "Chú ý, sau đây là đoạn mà mai bạn vẫn còn ngân nga."
    ],
    "fail": [
      "Hôm nay không có gì. Lời bài đi lạc đâu rồi.",
      "Kho lưu trữ im lặng. Như tôi khi nghe máy hút bụi.",
      "Không rap. Hôm nay là ngày nghỉ.",
      "Lời bài không có sẵn. Ta phải sống thiếu thơ một lúc."
    ]
  },
  "news": {
    "first": [
      "Lần đầu à? Vậy chào mừng. Bắt đầu với mục Nhạc nhé.",
      "Tin mới à? Với bạn chắc là tất cả. Tôi thì thuộc từng góc rồi.",
      "Bắt đầu từ thứ bạn quan tâm. Tôi sẽ bắt đầu từ đồ ăn, nhưng ở đây không có."
    ],
    "some": [
      "Có thứ mới đấy.",
      "Tôi có thông tin mới. Tiếc là không phải về hạt khô.",
      "Từ lần trước đã có thay đổi. May mà bạn về kịp."
    ],
    "none": [
      "Chưa có gì. Đôi khi chỉ là sống thôi.",
      "Không có tin mới. Chắc Radek lại đang chỉnh gì đó.",
      "Mọi thứ như cũ. Tôi, trang web và cơn đói bất tận của tôi.",
      "Hôm nay chẳng có gì mới. Kể cả trong bát."
    ],
    "lead": "Từ lần ghé trước của bạn:",
    "clip": "có clip mới {t}",
    "clips": [
      "",
      "có {n} clip mới, mới nhất là {t}"
    ],
    "posts": [
      "{n} bài mới trong Tin tức",
      "{n} bài mới trong Tin tức"
    ],
    "link": "Xem →",
    "history": "5 tin gần nhất",
    "web": [
      "Và mới trên trang web:",
      "Từ xưởng:",
      "Vừa lắp xong:"
    ],
    "webLast": [
      "Từ lần trước chưa có gì mới, nhưng đây là thay đổi gần nhất:",
      "Chưa có gì mới, chỉ có tin mới nhất từ xưởng:"
    ]
  },
  "admin": {
    "hello": [
      "Còn vài việc dang dở. Tôi sẽ bắt đầu với việc dễ nhất. Ví dụ nghỉ ăn.",
      "Báo cáo: có việc cần bạn chú ý. Lần này không phải bát của tôi.",
      "Có việc đang chờ xử lý. Tôi giám sát. Từ khoảng cách thoải mái.",
      "{name}, đây là danh sách những việc cần giải quyết.",
      "Đây là danh sách việc. Tôi muốn rút về không, nhưng chân không đủ dài."
    ],
    "missing": [
      "Vài bài hát còn thiếu thông tin. Tôi định điền, nhưng không gõ được bằng chân."
    ],
    "clean": [
      "Mọi thứ đã xong. Bạn có thể lo âm nhạc. Hoặc lo cho tôi.",
      "Kiểm tra xong. Bạn xứng đáng được nghỉ. Tôi nghỉ rồi."
    ],
    "reports": [
      "{n} bình luận bị báo cáo đang chờ kiểm tra",
      "{n} bình luận bị báo cáo đang chờ kiểm tra"
    ],
    "clips": [
      "{n} clip chưa có bài ({t})",
      "{n} clip chưa có bài (mới nhất: {t})"
    ],
    "lyrics": [
      "{n} bài chưa có lời",
      "{n} bài chưa có lời"
    ],
    "status": "Tình trạng trang",
    "toReports": "Báo cáo →",
    "toLyrics": "Sửa lời bài →"
  },
  "surprise": {
    "beatbox": "Bùm tss, ka tss, bùm bùm tss!",
    "dance": "Cái này bình thường phải học mấy năm.",
    "dance2": "Hip hop chảy trong máu tôi. Và trong chân.",
    "dance3": "Tránh ra, tôi lên sàn nhảy đây.",
    "robot": "Bật chế độ robot. Bíp. Búp. Meo.",
    "silly": "Không ai nhìn à? Tuyệt.",
    "breakdance": "Chín mạng, một cú xoay đầu. Đến giờ vẫn ổn.",
    "flair": "Cái này tôi chỉ làm được khi bụng đói.",
    "jump": "Thanh lịch thế này. Mà chẳng ai vỗ tay.",
    "dive": "Bắt được rồi! …Mà tôi bắt cái gì nhỉ?",
    "cheer": "Hoan hô! Cổ vũ ai thế? Tất nhiên là tôi.",
    "clap": "Vỗ tay cho tôi. Tôi tự bắt đầu cũng được.",
    "fistPump": "Yeah! Mở khóa cấp độ mới.",
    "laugh": "Xin lỗi, tôi vừa nhớ ra cái máy hút bụi.",
    "sing": "Tôi cũng biết hát. Hàng xóm biết rõ.",
    "rap": "Có mic, có beat… mà quên mất lời. Trí nhớ mèo.",
    "typing": "Đang nhắn Radek mua đồ ăn cho mèo. Viết hoa hết.",
    "stretchArms": "Chờ chút. Phải sắp xếp lại hết xương đã.",
    "neck": "Cứng cổ vì cứ nhìn bạn suốt.",
    "lie": "Kết thúc buổi diễn. Chúc ngủ ngon.",
    "thumbsUp": "Giơ ngón cái. Chỉ thế thôi, tôi là mèo.",
    "wave": "Chào. Đưa chân rồi, giữ được phong độ.",
    "nervous": "Cái gì thế?! …À. Không có gì.",
    "shrug": "Không biết. Và cũng chẳng quan tâm. Cảm giác tuyệt.",
    "lookAround": "Tôi nghe thấy gì đó. Chắc là suy nghĩ của mình.",
    "rhyme": "Bấm vào nhịp, / Kevin theo kịp, / mở Spotify / và nghe đi nào."
  },
  "building": [
    "Ở đây vẫn đang làm việc hết công suất! Trang web vẫn đang xây dựng, nên mỗi ngày có thể có điều gì đó mới. Còn tôi là triển lãm cố định.",
    "Suỵt… trang web vẫn đang xây. Hôm nay chưa có thì mai có thể có. Trừ kỷ luật. Cái đó thì không bao giờ.",
    "Thông báo: công trường đang thi công. Ngày nào cũng có thay đổi, nên hãy quay lại nhé. Tôi là chỉ huy công trường. Chủ yếu là chỉ huy giấc ngủ."
  ],
  "songs": {
    "S3BFk-qmXAY": [
      "Bài này tôi biết. Tôi có mặt lúc đó. Không muốn đâu."
    ],
    "LJ7ER355Hgg": [
      "Bài này tôi biết. Tôi có mặt lúc đó. Không muốn đâu.",
      "Bản làm lại. Radek thu lại lần nữa. Tôi thì để nguyên, nhưng chẳng ai hỏi tôi."
    ]
  },
  "clicks": [
    "Bạn thôi bấm vào tôi được không?",
    "Bạn không có việc gì hay hơn à?",
    "Được rồi. Bạn thắng."
  ]
};
