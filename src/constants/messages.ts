/**
 * User-facing loading phase messages for the Impact Analysis UI.
 */
export const LOADING_PHASES = {
    INITIAL: "AIによる分析を実行中...",
    COMPLEX: "分析が複雑なため、通常より時間がかかっています...",
    LOGIC: "最終的な論理構築を行っています。まもなく完了します...",
    NETWORK: "大規模なネットワークを構築中です。120秒以内に完了する見込みです...",
    TRANSFORM: "分析完了。グラフを描画中...",
} as const;

/**
 * Standard error messages for the Gemini API and application logic.
 */
export const ERROR_MESSAGES = {
    API_KEY_REQUIRED: "Gemini API Key is required.",
    API_KEY_INVALID: "APIキーが無効、または設定されていません。サイドバーのAPIキーを確認してください。",
    NO_TEXT_RETURNED: "No text returned from Gemini API",
    INVALID_JSON: (details: string) => `Invalid JSON format: ${details}`,
    TIMEOUT: "TIMEOUT: 分析に120秒以上かかったため中断しました。事象を短くするか、別のモデルをお試しください。",
    QUOTA_EXCEEDED: "QUOTA_EXCEEDED: リクエスト制限に達しました。しばらく待ってから再度お試しください。\n\n(※制限解除まであと数分〜数十分お待ちください。時間を置くと自動的に復活します)",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE: 現在モデルへのリクエストが集中しています。時間をおいてから、または別のモデルでお試しください。",
    NETWORK_ERROR: "ネットワークエラーが発生しました。接続を確認してください。",
    GENERIC_ERROR: "グラフの生成中にエラーが発生しました。",
    ERROR_PREFIX: (msg: string) => `エラー: ${msg}`,
} as const;

/**
 * Help texts and tooltips for UI elements.
 */
export const HELP_TEXTS = {
    INPUT_PLACEHOLDER: "例: 中央経済における地政学リスクの増大や、特定の技術革新による供給ショックなど...",
    SENSITIVITY_TOOLTIP: "AIが判定した影響力（スコア）に乗算する独自の感度パラメータです。スライダを動かすとグラフの太さやヒートマップ表示が連動します。",
    FILTER_TOOLTIP: "指定したスコア以下のノードやエッジを非表示にします。複雑なグラフの重要な部分だけを抽出するのに便利です。",
} as const;

/**
 * Messages related to history management.
 */
export const HISTORY_MESSAGES = {
    CLEAR_CONFIRM: "すべての分析履歴を削除してもよろしいですか？",
    LOAD_SUCCESS: "履歴から分析データを正常に読み込みました。",
} as const;

/**
 * Supplementary notes for the analysis methodology.
 */
export const ANALYSIS_NOTES = {
    SCORE_DEFINITION: "・0〜±1.0の範囲。絶対値が大きいほど波及効果が強力です。",
    WACC_CAPEX_NOTE: "・Tier 4では、資本コスト(WACC)や設備投資(CAPEX)への長期的影響を分析しています。",
    STRUCTURAL_CHANGE: "・一時的な変動だけでなく、産業構造の転換やサプライチェーンの恒久的な再編を視覚化します。",
} as const;
