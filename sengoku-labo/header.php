<?php require_once __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $page_title ?? SITE_NAME ?></title>
  <meta name="description" content="<?= $page_desc ?? 'AIを活用したデジタルサービスの開発・導入支援。えほんごとのたねをはじめ、BtoBサービスを提供しています。' ?>">
  <link rel="stylesheet" href="<?= BASE_URL ?>/css/style.css">
</head>
<body>
<nav class="nav">
  <div class="container">
    <a href="<?= BASE_URL ?>/" class="nav_logo"><?= SITE_NAME ?></a>
    <ul class="nav_links">
      <li><a href="<?= BASE_URL ?>/#services">サービス</a></li>
      <li><a href="<?= BASE_URL ?>/#btob">BtoBプラン</a></li>
      <li><a href="<?= BASE_URL ?>/contact.php">お問い合わせ</a></li>
      <li><a href="<?= BASE_URL ?>/dashboard.php" class="btn_nav">クライアントログイン</a></li>
    </ul>
  </div>
</nav>
