<?php
$page_title = 'クライアント管理 | SengokuLabo';
require 'header.php';
?>

<section class="page_hero">
  <div class="container">
    <h1>クライアント管理画面</h1>
    <p>質問・テーマの管理、利用状況の確認ができます。</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="beta_banner">β版機能 — 現在準備中です。リリース時にご登録のメールアドレスへご案内します。</div>

    <div class="card_grid">
      <div class="card card_feature">
        <h3>📝 質問・テーマ管理</h3>
        <p>自社サービス向けの質問セットやテーマをカスタマイズできます。</p>
      </div>
      <div class="card card_feature">
        <h3>📊 利用状況</h3>
        <p>月ごとの利用件数・売上レポートを確認できます。</p>
      </div>
      <div class="card card_feature">
        <h3>⚙️ 設定</h3>
        <p>プラン変更・請求情報・担当者の管理ができます。</p>
      </div>
    </div>

    <div class="dashboard_cta">
      <p class="text_muted">ご利用登録はこちら</p>
      <a href="register.php" class="btn btn_primary">クライアント登録</a>
    </div>
  </div>
</section>

<?php require 'footer.php'; ?>
