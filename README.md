# AshiArt

![README_header](https://github.com/user-attachments/assets/8cf74ee5-c692-4f53-b57e-4cc4daae2841)

## 各種リンク

- サイト URL:https://ashiart.vercel.app/
- canva URL:https://www.canva.com/design/DAG2Mtx20no/hRDT1oBMKq8AcZpFIRxSXw/edit?utm_content=DAG2Mtx20no&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

### サイト QR コード

![サイトQRコード](frontend/public/images/QR.png)

> [!TIP]
> スマートフォンでのアクセスがオススメです

## 製品概要

ユーザが描いた絵を再現したランニングコースを生成するアプリです

### 背景(製品開発のきっかけ、課題等）

みなさん、ランニングしていますか？
私たちのチームには定期的にランニングをするメンバーが多いです！健康目的でランニングを行う人は多いと思います。
そんな中、こんなポストを見かけました。

<div align="left">
<img height="350" alt="image" src="https://github.com/user-attachments/assets/3b8f3868-f7f2-484b-a0dc-074a21f04df2" />
</div>

(https://x.com/yomo_tri/status/1969979228914651139)

「**GPS アート？！楽しそう！ちょっとやってみたい！**」
と、思いましたが、コースの設計に時間がかかりそうで気軽には始められませんでした...
そんな経験から、**GPS アートのコース作成を手動で行うのは時間がかかり、気軽に作れない**という課題を**一筆書きの絵から簡単にランニングコースを作成できるアプリ**によって解決しようと考えました。

GPS アートを簡単に描けるようになれば、ランニングの**モチベーションの向上**に繋がりますよね！

### GPS アートとは

<table>
  <tr>
    <td>
      <img width="250" alt="image" src="https://github.com/user-attachments/assets/35abd6fb-4796-47a1-9a34-8fba848f7d1d" />
    </td>
    <td>
      <img width="250" alt="image" src="https://github.com/user-attachments/assets/44f42365-db82-4fc1-aef9-1cf62496ae03" />
    </td>
  </tr>
</table>
(出典：https://www.bgf.or.jp/gpsart/2018result.html)

GPS アートとは、GPS を使用して現在位置を記録しながら移動し、その軌跡で大規模な地上絵を描くアクティビティのことを指します。
当初はアートの要素が強かった GPS アートですが、徐々に日々のフィットネスへの追加のモチベーションとして、シンプルな図形を走る人々が増え始めました。
そして、コロナ禍を経てランニングを行う人口が増えたことにより、その成果として、自身が走った独創的なルートを、GPS アプリや SNS を通してシェアする文化が普及しています。

### 製品説明（具体的な製品の説明）

一筆書きで描いた絵から独自のアルゴリズムで実際に走れる最適なコースを設計し、GPS アートによる、いつもと違ったランニング体験を簡単に行えます。

### 特長

#### 1. 一筆書きの絵からランニングコースを提案

このアプリのメインの機能です。
ユーザは自由に一筆書きで絵を描き、自分だけのランニングコースを作成できます。
スタート地点と走行距離の調整も可能です。

<div><video height="300" controls src="https://github.com/user-attachments/assets/ccec795f-87b4-46b7-a95b-97fc71eff704" muted="false"></video></div>

#### 2. おすすめの絵から選択も可能

一筆書きの絵が思いつかなくても、アプリが提案するいくつかのサンプル図形からコースを作成することもできます。同じ図形でも、スタート地点や走行距離を変えるだけで、全く異なるランニングコースを設計できます。

<div><video height="300" controls src="https://github.com/user-attachments/assets/e160864e-a80c-45c3-93d6-4436a50f842e" muted="false"></video></div>

#### 3. コースの保存・お気に入り登録・削除機能

作成したコースはデータベースに保存され、いつでも一覧で見ることができます。
気に入ったコースはお気に入り登録、不要なコースは削除をすることも可能です。
「作成順」や「近い順(現在地からスタート地点までの距離)」でソートをすることもでき、見やすい UI を心がけています。

<div><video height="300" controls src="https://github.com/user-attachments/assets/b48b828a-d0e3-4693-8003-80448aa4210d" muted="false"></video></div>

### 解決出来ること

- これまで時間がかかっていた GPS アート用のランニングコースを、とても**簡単**に作成することができます。

  - 例えば、このアプリを使うと、札幌市の中に北海道を描く！なんてこともできます↓↓

  <img height="300" alt="Image" src="https://github.com/user-attachments/assets/f6bf4b34-2dc5-4a8d-bd02-80069c5f3939" />

- これにより、誰もが好きな絵のコースを設計して実際に走ることができるので、ランニングのモチベーションにつながります！

### 今後の展望

GPS アートを使ったランニング体験を手軽に提供するため、**Award Day** に行けることになったら以下の機能を実装したいと考えています！

- 音声でのランニングコースのナビゲーション機能
  - せっかくコースの通りに、実際に走ってみたいですよね！
- このアプリを利用して作り上げた GPS アートのシェア機能

ナビゲーション画面のイメージ

<img height="300" alt="Image" src="https://github.com/user-attachments/assets/161e8751-e2d8-4339-bd72-496e69abb4f5" />

### 注力したこと（こだわり等）

- 経路計算アルゴリズムのこだわり
  - 複数の文献を参考にして経路計算を実現独自のアルゴリズムを考案しました。このREADME.mdの最後で内容を説明します
  - https://github.com/jphacks/sp_2509/pull/55/files
- GitHubの機能を精一杯活用してチームメンバーの開発体験を高めました
  - PullRequestの作成時にビルドチェックと単体テストの実行を回したり、自動デプロイ環境を構築したりして、CI/CD環境を整えました
  　　- 本番環境が動かない！というようなトラブルはこれのおかげで起きませんでした。  
  - GitHub Projectのカンバン機能を使ってチームメンバーのタスクを簡単に確認できるようにしました
  - GitHub Copilotを使ってコードレビュー自動化の環境を整えました
- チームメンバー間で作業負荷に大きな偏りもなく、全員がGitHubの機能を使いこなして、プロダクト作成に力を注ぐことができました
  -  ([issue番号3桁突破](https://github.com/jphacks/sp_2509/issues?q=is%3Aissue%20state%3Aclosed))
  - <img height="300" alt=" 2025-10-20 1 06 21" src="https://github.com/user-attachments/assets/83b37e77-cc5d-4f70-a453-c6ecf337ac72" />

  

## 開発技術

### 活用した技術

<img height="300" alt="JPHACKS2025_sp2509_O's" src="https://github.com/user-attachments/assets/11cdc80f-57db-44b6-ad17-3e80728ca69b" />

#### フロントエンド

- Next.js + TypeScript
  - フロントエンドのフレームワーク
- Leaflet.js
  - 地図表示ライブラリ。生成されたコースの描画に使用しました。
- ESLint
  - コードの静的解析ツール。チームのメンバーでコードスタイルを統一するために導入しました。

#### バックエンド

- FastAPI
  - バックエンドのフレームワーク
- OSMNX(Open Street Map NetworkX)
  - 道路ネットワークデータの取得
  - バックエンドの経路計算に利用
- SQLite
  - 作成したコースを保存するための DB

#### インフラ

- vercel
  - フロントエンドのデプロイ先として選定しました
- GitHub Actions(https://github.com/jphacks/sp_2509/actions)
  - Frontend CI でフロントエンドの**ビルドチェック**を実施
  - Backend CI でバックエンドの**ユニットテスト**を実施
  - CD として vercel の本番環境に自動デプロイ
    - CD を構築して自動デプロイを実現することで開発メンバーのデプロイの手間を省ことができました。
- GitHub Copilot (コードレビュー)
  - Pull Request に対して Copilot に自動的にコードレビューをしてもらうワークフローを追加することで他のメンバーのコードレビュー時間を短縮し、作業の効率化につながりました。
    - 例: https://github.com/jphacks/sp_2509/pull/113

#### その他ツール

| ツール                      | 用途                   | 詳細                                                                                                         |
| :-------------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Figma**                   | UI/UX デザイン         | 各ページのワイヤーフレーム・プロトタイプを作成。アプリの操作フローを明確化し、開発メンバー間で共有しました。 |
| **Consense**                | チーム内の情報共有     | 機能仕様やデザイン方針などの情報を整理し、メンバー間での認識を揃えるために使用しました。                     |
| **Clip Studio Paint**       | 描画素材の作成         | アプリ紹介用のイラストやロゴのラフスケッチを制作しました。                                                   |
| **Canva**                   | プレゼン資料・画像作成 | README や発表用スライドのビジュアルを作成しました。                                                          |
| **GitHub Project (Kanban)** | タスク管理             | Issue をもとに開発タスクを可視化し、進捗を一目で確認できるようにしました。                                   |

#### デバイス

- スマートフォン

### 独自技術

#### ハッカソンで開発した独自機能・技術

##### HackDay 以前に作成した機能

- 基本的なコース計算のアルゴリズムの検討と仮実装
- API 設計,DB 設計
- Figma によるデザイン設計
  - https://www.figma.com/design/rft6M0sW2d7Rax1bfat3SS/Runninng?t=yCbRqFttgztGwUT3-1

##### HackDay 期間中に作成した機能

- フロントエンド
  - UI コンポーネントの作成
  - 各ページの作成 (例: https://github.com/jphacks/sp_2509/issues/24)
  - ユーザの描いた線がローディング時のアニメーションになる機能
- バックエンド
  - API の実装 (例: https://github.com/jphacks/sp_2509/pull/49)
  - API の単体テストの実装 (例: https://github.com/jphacks/sp_2509/pull/62)
  - 経路探索アルゴリズムのクラス化&アルゴリズムの改善 (例: https://github.com/jphacks/sp_2509/pull/55)
- インフラ
  - CI/CD 環境の構築(例: https://github.com/jphacks/sp_2509/actions/workflows/ci.yml)

##### 経路探索アルゴリズムについて

単なる**最短経路**を見つけるアプリなら、GoogleMaps のように世の中にいくらでもあります。しかし、私たちが作りたかったのはユーザーの描きたいという想いを実現するための異なる機能です。そこで、古典的な [ダイクストラ法](https://ja.wikipedia.org/wiki/%E3%83%80%E3%82%A4%E3%82%AF%E3%82%B9%E3%83%88%E3%83%A9%E6%B3%95)を改良したアルゴリズムを実装しました。

ユーザーが描いた形を、そのまま地図に重ねても、道路の向きと合わず、うまくコースが作れません。そこで、まず手書きの形を少しずつ回転させ最適な角度を計算しています。最適な角度が決まったら、その回転させた入力の曲線を、経路探索の基準点となるいくつかのチェックポイントに分割します。これにより、「A 地点から B 地点へ」「B 地点から C 地点へ」という具体的な経路探索のタスクに分解できます。そして、サンプリングした各チェックポイントの間の経路を探索します。

そうして見つかったすべての部分的な経路を一つにつなぎ合わせることで、手書きの形を最も忠実に再現した、実際に走れる GPS アートコースが完成します。
