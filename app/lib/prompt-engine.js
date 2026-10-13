export const CHANNELS = [
  "Bài đăng mạng xã hội",
  "Video ngắn",
  "Bài website",
  "Email",
  "Tin nhắn chăm sóc",
  "Bài báo / PR",
];

export const GOALS = [
  "Hiểu rõ một vấn đề",
  "Tin tưởng hơn",
  "Nhận ra nhu cầu",
  "Thực hiện một hành động",
  "Ghi nhớ thông điệp",
  "Tham gia trao đổi",
  "Quay lại theo dõi",
  "Chia sẻ cho người khác",
];

export const FORMATS = [
  "Bài hoàn chỉnh",
  "Bản ngắn",
  "Kịch bản nói",
  "Dàn ý",
  "Chuỗi nội dung",
  "Nội dung cho thiết kế",
];

export const FORMULAS = [
  "Vấn đề → Hệ quả → Giải pháp",
  "Hiện trạng → Mong muốn → Cách làm",
  "Lợi ích → Bằng chứng → Hành động",
  "Câu chuyện → Bài học → Đề xuất",
  "Câu hỏi → Giải đáp → Kết luận",
  "Luận điểm → Dẫn chứng → Kết luận",
  "Trước → Sau → Cầu nối",
  "Thông tin quan trọng trước",
];

export const CONTENT_STYLES = [
  "Rõ ràng trung tính",
  "Chuyên môn dễ hiểu",
  "Phân tích chặt chẽ",
  "Trò chuyện gần gũi",
  "Kể chuyện",
  "Thấu hiểu",
  "Thuyết phục",
  "Hướng dẫn từng bước",
  "Tin tức",
  "Tối giản",
];

export const CONTENT_LINES = [
  "Giải thích từng bước",
  "Gỡ bỏ hiểu lầm",
  "So sánh lựa chọn",
  "Danh sách kiểm tra",
  "Hỏi đáp chuyên gia",
  "Hậu trường",
  "Câu chuyện đồng cảm",
  "Tình huống thực tế",
  "Chia sẻ trải nghiệm",
  "Thử nghiệm và kết quả",
  "Điểm khác biệt",
  "Lợi ích nổi bật",
];

export const IMPROVE_TYPES = [
  "Làm rõ ý",
  "Rút gọn",
  "Bổ sung mạch nối",
  "Sắp xếp lại",
  "Sửa ngôn ngữ",
  "Đổi chất giọng",
  "Tăng tính thuyết phục",
  "Giữ ý, viết mới toàn bộ",
];

export const TEMPLATE_PRESETS = [
  {
    id: "cafe",
    label: "Tiệm bánh / F&B",
    product: "Tiệm bánh thủ công nhận giao bữa sáng theo tuần, dùng nguyên liệu theo mùa và công khai ngày làm bánh.",
    audience: "Người đi làm bận rộn muốn có bữa sáng gọn nhẹ nhưng vẫn quan tâm thành phần và độ tươi.",
    topic: "Giới thiệu gói bánh sáng giao định kỳ cho văn phòng",
  },
  {
    id: "skincare",
    label: "Mỹ phẩm / Skincare",
    product: "Kem chống nắng dùng hằng ngày, kết cấu nhẹ, không nâng tông và phù hợp với người thường xuyên làm việc ngoài trời.",
    audience: "Người trẻ muốn duy trì thói quen chống nắng nhưng ngại cảm giác bí da và lớp nền bị vón.",
    topic: "Hướng dẫn chọn kem chống nắng dễ dùng mỗi ngày",
  },
  {
    id: "fashion",
    label: "Thời trang",
    product: "Bộ sưu tập tủ đồ tối giản gồm các món có thể phối chéo, chất liệu dễ chăm sóc và phom phù hợp nhiều hoàn cảnh.",
    audience: "Nhân viên văn phòng muốn mặc chỉn chu mà không mất nhiều thời gian chọn đồ mỗi sáng.",
    topic: "Xây dựng tủ đồ đi làm gọn nhẹ với tám món nền tảng",
  },
  {
    id: "real-estate",
    label: "Bất động sản",
    product: "Dịch vụ quản lý căn hộ cho thuê, phụ trách tìm khách, bàn giao, thu tiền và báo cáo vận hành hằng tháng.",
    audience: "Chủ căn hộ ở xa hoặc không có thời gian trực tiếp xử lý việc cho thuê.",
    topic: "Những đầu việc chủ nhà có thể giao cho đơn vị quản lý cho thuê",
  },
  {
    id: "course",
    label: "Lớp học trực tuyến",
    product: "Lớp phân tích dữ liệu thực hành trong bốn tuần, học trên bộ dữ liệu thật và có phiên góp ý bài tập trực tiếp.",
    audience: "Người làm vận hành muốn đọc số liệu tốt hơn nhưng chưa có nền tảng phân tích chuyên sâu.",
    topic: "Mời đăng ký lớp phân tích dữ liệu dành cho người mới",
  },
];

export function createEmptyBrief() {
  return {
    product: "",
    topic: "",
    feeling: "🥰 Chân thành, thấu hiểu",
    channel: "Bài đăng mạng xã hội",
    channels: ["Bài đăng mạng xã hội"],
    extra: "",
    variantCount: "1",
    audience: "",
    hasHook: "Tự xây dựng điểm mở",
    goals: ["Thực hiện một hành động"],
    formats: ["Bài hoàn chỉnh"],
    contentShape: "Theo đoạn",
    lengthType: "Số từ",
    lengthValue: "400",
    contentLines: [],
    mainMessage: "",
    subMessage: "",
    formula: "Vấn đề → Hệ quả → Giải pháp",
    style: "Rõ ràng trung tính",
    cta: "Mở trang thông tin",
    evidence: "",
    vocabRatio: "50% Đời thường – 50% Chuẩn mực",
    vocabRatioValue: 50,
    qualityRatioValue: 50,
    sourceContent: "",
    improveTypes: ["Làm rõ ý"],
    styleSample: "",
    styleTopic: "",
    styleExtra: "",
    ideaCount: "5 hướng",
    advancedMode: "Hệ thống dựng khung",
  };
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value || "";
}

function field(label, value) {
  const text = asList(value).toString().trim();
  return text ? `- ${label}: ${text}` : "";
}

export function summarizeBrief(brief) {
  const length = [brief.lengthValue, brief.lengthType].filter(Boolean).join(" ");
  return [
    field("Sản phẩm hoặc vấn đề", brief.product),
    field("Nội dung cần triển khai", brief.topic),
    field("Người đọc hướng đến", brief.audience),
    field("Kênh sử dụng", brief.channels?.length ? brief.channels : brief.channel),
    field("Kết quả mong muốn", brief.goals),
    field("Loại bản thảo", brief.formats),
    field("Giọng thể hiện", brief.style || brief.feeling),
    field("Cấu trúc hiển thị", brief.contentShape),
    field("Độ dài dự kiến", length),
    field("Ý chính cần ghi nhớ", brief.mainMessage),
    field("Ý bổ trợ", brief.subMessage),
    field("Dữ kiện kiểm chứng", brief.evidence),
    field("Yêu cầu riêng", brief.extra),
  ]
    .filter(Boolean)
    .join("\n");
}

export function compileWritePrompt({ mode, brief }) {
  const advanced = mode === "advanced";
  const count = brief.variantCount || "1";
  const vocabNote =
    brief.vocabRatioValue !== undefined
      ? `- Cách nói: ${brief.vocabRatioValue}% Đời thường – ${100 - brief.vocabRatioValue}% Chuẩn mực`
      : field("Cách nói", brief.vocabRatio);
  const qualityNote =
    brief.qualityRatioValue !== undefined
      ? `- Cơ sở thuyết phục: ${brief.qualityRatioValue}% Trải nghiệm – ${100 - brief.qualityRatioValue}% Dữ kiện`
      : "";

  return {
    system:
      "Bạn là biên tập viên nội dung tiếng Việt giàu kinh nghiệm. Hãy viết rõ ý, tự nhiên, phù hợp ngữ cảnh sử dụng; không bịa số liệu và không tự thêm cam kết về y tế, tài chính hoặc pháp lý.",
    user: `Hãy tạo ${count} bản nội dung từ dữ liệu đầu vào dưới đây.

Mức biên tập: ${mode}
${advanced ? "Chế độ chỉ đạo: vận dụng đường lập luận, khung triển khai, chất giọng, điểm kết và nguồn được cung cấp." : "Chế độ dựng bài: ưu tiên mạch lạc, đúng người đọc, đúng ngữ cảnh sử dụng và có kết thúc phù hợp."}

Dữ liệu đầu vào:
${summarizeBrief(brief)}
${field("Khung thuyết phục", brief.formula)}
${field("Góc triển khai", brief.contentLines)}
${field("Điểm kết", brief.cta)}
${vocabNote}
${qualityNote}

Tiêu chuẩn đầu ra:
- Hai dòng đầu phải tạo được lý do để đọc tiếp.
- Chỉ trả về nội dung hoàn chỉnh, không kể lại quá trình thực hiện.
- Nếu có nhiều bản, phân tách và đánh số rõ ràng.
- Khi dữ liệu chưa đủ, chỉ dùng giả định trung tính và tuyệt đối không tạo bằng chứng mới.`,
  };
}

export function compileImprovePrompt({ mode, brief }) {
  return {
    system:
      "Bạn là biên tập viên tiếng Việt. Hãy cải thiện bản viết nhưng giữ nguyên sự thật, chủ đích và thông tin cốt lõi của tác giả.",
    user: `Biên tập lại nội dung dưới đây.

Mức biên tập: ${mode}
Điểm cần xử lý: ${asList(brief.improveTypes)}
Yêu cầu riêng: ${brief.extra || "Không có"}

Bản viết ban đầu:
${brief.sourceContent}

Kết quả cần trả về:
- Nêu tối đa 5 vấn đề quan trọng nếu bản gốc thực sự cần sửa.
- Cung cấp một bản đã biên tập hoàn chỉnh.
- Giữ nguyên dữ kiện; không thêm số liệu hoặc cam kết mới.`,
  };
}

export function compileStyleTransferPrompt({ mode, brief }) {
  return {
    system:
      "Bạn là biên tập viên có khả năng nhận diện phong cách viết. Hãy học cấu trúc, nhịp câu, cách dùng từ và sắc thái của mẫu nhưng không sao chép câu chữ.",
    user: `Phân tích mẫu tham chiếu rồi viết một nội dung mới.

Mức biên tập: ${mode}

Mẫu tham chiếu:
${brief.styleSample}

Nội dung mới cần triển khai:
${brief.styleTopic}

Yêu cầu riêng:
${brief.styleExtra || "Không có"}

Kết quả cần trả về:
- Tóm tắt đặc điểm phong cách trong 4-6 ý ngắn.
- Viết bản mới thể hiện các đặc điểm đó.
- Không lặp lại nguyên văn câu trong mẫu trừ tên riêng hoặc trích dẫn bắt buộc.`,
  };
}

export function compileIdeasPrompt({ mode, brief }) {
  return {
    system:
      "Bạn là người hoạch định nội dung, có nhiệm vụ tìm các hướng tiếp cận khác nhau, thực tế và phù hợp với người đọc Việt Nam.",
    user: `Đề xuất các hướng triển khai nội dung.

Mức biên tập: ${mode}
Số hướng cần có: ${brief.ideaCount}

Sản phẩm hoặc vấn đề:
${brief.product}

Người đọc hướng đến:
${brief.audience}

Kết quả mong muốn:
${asList(brief.goals)}

Mỗi hướng cần có:
- Câu mở đầu gợi ý
- Góc tiếp cận
- Lý do phù hợp với người đọc
- Cách triển khai đề xuất
- Hành động mong muốn`,
  };
}

export function compilePromptByWorkflow({ workflow, improveSubmode, mode, brief }) {
  if (workflow === "improve" && improveSubmode === "style") {
    return compileStyleTransferPrompt({ mode, brief });
  }
  if (workflow === "improve") {
    return compileImprovePrompt({ mode, brief });
  }
  if (workflow === "ideas") {
    return compileIdeasPrompt({ mode, brief });
  }
  return compileWritePrompt({ mode, brief });
}
