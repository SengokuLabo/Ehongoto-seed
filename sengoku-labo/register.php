<?php
$page_title = 'クライアント登録 | SengokuLabo';
$page_desc  = 'えほんごとのたねBtoBプランの新規クライアント登録。';
require 'header.php';
?>

<section class="page_hero">
  <div class="container">
    <h1>クライアント登録</h1>
    <p>BtoBプランのご利用登録・サブスクリプション契約はこちらから。</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="beta_banner">β版機能 — 現在準備中です。お問い合わせよりご相談ください。</div>

    <div class="form_wrap">
      <div class="card plan_intro">
        <h3>ご登録の流れ</h3>
        <ol class="steps_list">
          <li>下記フォームよりお申し込み</li>
          <li>担当者よりご連絡・プランのご確認</li>
          <li>サブスクリプション契約・お支払い設定</li>
          <li>専用テーマ・質問の設定</li>
          <li>サービス開始</li>
        </ol>
      </div>

      <form id="register_form">
        <div class="form_group">
          <label>会社名・屋号 <span class="required">*</span></label>
          <input type="text" name="company" placeholder="株式会社〇〇" required>
        </div>
        <div class="form_group">
          <label>担当者名 <span class="required">*</span></label>
          <input type="text" name="name" placeholder="山田 太郎" required>
        </div>
        <div class="form_group">
          <label>メールアドレス <span class="required">*</span></label>
          <input type="email" name="email" placeholder="example@example.com" required>
        </div>
        <div class="form_group">
          <label>希望プラン</label>
          <select name="plan">
            <option value="standard">スタンダード</option>
            <option value="custom">カスタム</option>
            <option value="enterprise">エンタープライズ</option>
          </select>
        </div>
        <div class="form_group">
          <label>ご利用の目的・背景</label>
          <textarea name="message" placeholder="どのようなサービスに組み込みたいか、ご自由にご記入ください"></textarea>
        </div>
        <button type="submit" class="btn btn_primary btn_submit" disabled>
          申し込む（準備中）
        </button>
        <p class="form_note_center">
          準備中のため、現在は <a href="contact.php" class="link_accent">お問い合わせフォーム</a> よりお申し込みください。
        </p>
      </form>
    </div>
  </div>
</section>

<?php require 'footer.php'; ?>
