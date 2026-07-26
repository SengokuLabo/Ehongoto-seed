<?php
$page_title = 'お問い合わせ | SengokuLabo';
$page_desc  = 'えほんごとのたねの導入・BtoBプランに関するお問い合わせはこちらから。';
require 'header.php';
?>

<section class="page_hero">
  <div class="container">
    <h1>お問い合わせ</h1>
    <p>導入のご検討・ご質問など、お気軽にご連絡ください。</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="form_wrap">
      <form id="contact_form">
        <div class="form_group">
          <label>お名前 <span class="required">*</span></label>
          <input type="text" name="name" placeholder="山田 太郎" required>
        </div>
        <div class="form_group">
          <label>会社名・屋号</label>
          <input type="text" name="company" placeholder="株式会社〇〇">
        </div>
        <div class="form_group">
          <label>メールアドレス <span class="required">*</span></label>
          <input type="email" name="email" placeholder="example@example.com" required>
        </div>
        <div class="form_group">
          <label>お問い合わせ種別</label>
          <select name="type">
            <option value="btob">BtoBプランの導入について</option>
            <option value="custom">カスタマイズについて</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div class="form_group">
          <label>お問い合わせ内容 <span class="required">*</span></label>
          <textarea name="message" placeholder="ご質問・ご要望をご記入ください" required></textarea>
        </div>
        <p class="form_note">
          ご入力いただいた個人情報は、お問い合わせへの回答のみに使用します。<br>
          <a href="legal.php#privacy" class="link_accent">プライバシーポリシー</a>をご確認ください。
        </p>
        <button type="submit" class="btn btn_primary btn_submit">送信する</button>
      </form>

      <div id="form_success" class="form_msg success">
        お問い合わせを受け付けました。2営業日以内にご連絡いたします。
      </div>
      <div id="form_error" class="form_msg error">
        送信に失敗しました。お手数ですが <a href="mailto:<?= EMAIL ?>" class="link_accent"><?= EMAIL ?></a> までご連絡ください。
      </div>
    </div>
  </div>
</section>

<script>
document.getElementById('contact_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '送信中...';

  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      form.style.display = 'none';
      document.getElementById('form_success').classList.add('visible');
    } else {
      throw new Error();
    }
  } catch {
    document.getElementById('form_error').classList.add('visible');
    btn.disabled = false;
    btn.textContent = '送信する';
  }
});
</script>

<?php require 'footer.php'; ?>
