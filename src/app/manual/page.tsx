"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

/** 公開先によって画像の置き場所が変わるため、基準のパスを付ける */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Section = { id: string; title: string };

const SECTIONS: Section[] = [
  { id: "what", title: "1. このツールでできること" },
  { id: "home", title: "2. ホーム画面の見かた" },
  { id: "find", title: "3. 資料を探す" },
  { id: "move", title: "4. 画面を移動する（メニュー）" },
  { id: "inline", title: "5. 一覧でその場で直す" },
  { id: "bulk", title: "6. まとめて変える" },
  { id: "detail", title: "7. 資料を開く・詳しく見る" },
  { id: "new", title: "8. 資料を1件ずつ登録する" },
  { id: "csv", title: "9. CSVでまとめて登録する" },
  { id: "categories", title: "10. 分類を整える" },
  { id: "cross", title: "11. 1つの資料を複数の大項目に入れる" },
  { id: "save", title: "12. データを守る" },
  { id: "login", title: "13. 他のPCから使う" },
  { id: "trouble", title: "14. 困ったときは" },
];

export default function ManualPage() {
  const [active, setActive] = useState<string>(SECTIONS[0]!.id);
  const [tocOpen, setTocOpen] = useState(false);

  // いま読んでいるところを目次で光らせる。
  // 画面の上から少し下がった位置を基準に、そこを最後に通り過ぎた見出しを選ぶ。
  useEffect(() => {
    const update = () => {
      const line = 140;
      let current = SECTIONS[0]!.id;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = section.id;
      }
      // 一番下まで来たら最後の項目を選ぶ
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 8) {
        current = SECTIONS[SECTIONS.length - 1]!.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="space-y-5">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="focus-ring rounded font-bold hover:underline">
          ホーム
        </Link>
        <span className="mx-2">＞</span>
        <span>使い方（操作マニュアル）</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-[#0e2245] sm:text-3xl">
          教育コンテンツMASTER 操作マニュアル
        </h1>
        <p className="mt-2 text-slate-600">
          はじめての方でも順番に読めば使えるようにまとめました。
          <br className="hidden sm:block" />
          画面の写真はサンプルです。実際のデータは会社ごとの内容になります。
        </p>
      </header>

      {/* スマホ・タブレット用の目次（折りたたみ） */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setTocOpen((v) => !v)}
          aria-expanded={tocOpen}
          className="focus-ring flex w-full items-center justify-between rounded-xl border-2 border-[#0f5c3f] bg-white px-4 py-3 text-base font-bold text-[#0f5c3f]"
        >
          <span>目次（全{SECTIONS.length}項目）</span>
          <span aria-hidden>{tocOpen ? "▲" : "▼"}</span>
        </button>
        {tocOpen ? (
          <ol className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-white p-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setTocOpen(false)}
                  className="focus-ring block rounded-lg px-3 py-2.5 text-[15px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        {/* PC用の目次（横に固定） */}
        <aside className="hidden lg:block">
          <nav
            aria-label="目次"
            className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3"
          >
            <p className="px-2 pb-2 text-sm font-bold text-slate-500">目次</p>
            <ol className="space-y-0.5">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={active === section.id ? "true" : undefined}
                    className={
                      active === section.id
                        ? "focus-ring block rounded-lg bg-[#e4f0e9] px-3 py-2 text-sm font-bold text-[#0f5c3f]"
                        : "focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0 space-y-8">
          <Section id="what" title="1. このツールでできること">
            <p>
              社内にちらばっている資料・教材・動画を、
              <strong>1か所にまとめて、必要なときにすぐ取り出す</strong>ためのツールです。
            </p>
            <List
              items={[
                "どこに何があるかを一覧で管理できる",
                "大項目 ＞ 中項目 ＞ 小項目 の3段階で整理できる",
                "「未着手」「制作中」「完成」など、資料の状態を記録できる",
                "キーワードで横断検索できる",
                "資料そのものは今までどおりの場所（共有フォルダ・Canva・YouTubeなど）に置いたままでよい",
              ]}
            />
            <Note tone="info">
              このツールは<strong>資料の置き場所と状態を管理する台帳</strong>です。
              PDFや動画のファイル自体をこの中に保存するわけではありません。
            </Note>
          </Section>

          <Section id="home" title="2. ホーム画面の見かた">
            <p>ホームを開くと、まず全体の状況が見えます。</p>
            <Shot
              src="02-status-buttons"
              alt="ホーム画面の上部。全コンテンツ数と状態ごとの件数が並んでいる"
              caption="上部：全体の件数と、状態ごとの件数"
            />
            <List
              items={[
                "「全コンテンツ数」…登録されている資料の総数。押すとすべて表示",
                "「完成」「制作中」「要修正」「要更新」…押すと、その状態のものだけに絞り込み",
                "「分類待ち」…大項目がまだ決まっていないもの",
                "「全体の完成率」…登録件数のうち、状態が「完成」のものの割合",
              ]}
            />
          </Section>

          <Section id="find" title="3. 資料を探す">
            <SubTitle>大項目から探す</SubTitle>
            <p>
              画面を下にたどると、大項目ごとのカードが並びます。
              <strong>カードを押すと、その大項目の中だけ</strong>が開きます。
            </p>
            <Shot
              src="01-home-board"
              alt="大項目ごとのカードが並んだ画面"
              caption="カードには件数・完成率・その中にある中項目が出ます"
            />
            <Shot
              src="03-major-list"
              alt="大項目を開いた一覧画面"
              caption="開いた画面。緑の帯に「いまここだけを表示しています」と出ます"
            />
            <List
              items={[
                "開いているあいだは、検索も絞り込みもその大項目の中だけになります",
                "他の大項目に間違って触ってしまう心配がありません",
                "「← 大項目の一覧に戻る」でいつでも戻れます",
              ]}
            />

            <SubTitle>キーワードで探す</SubTitle>
            <p>
              検索欄にことばを入れると、タイトル・概要・タグ・担当者などをまとめて探します。
              ひらがな・カタカナ・全角半角の違いは気にしなくて大丈夫です。
            </p>

            <SubTitle>並び順を変える</SubTitle>
            <p>右上の「並び順」から選べます。よく使うのは次の2つです。</p>
            <List
              items={[
                "「大項目順」…大項目 ＞ 中項目 ＞ 小項目 の順に整列。棚を順番に見たいとき",
                "「最終更新日が新しい順」…最近さわったものから。作業の続きをしたいとき",
              ]}
            />
          </Section>

          <Section id="move" title="4. 画面を移動する（メニュー）">
            <p>
              画面の左上にある <strong>「☰ メニュー」</strong> は、
              <strong>どの画面からでも</strong>開けます。
            </p>
            <Shot
              src="06-menu"
              alt="メニューを開いたところ。画面の一覧と大項目の一覧が出ている"
              caption="上段が画面、下段が大項目。件数も出ます"
            />
            <Note tone="tip">
              資料の詳細を見たあと、別の大項目へ移りたいときは、
              ホームに戻らずここから<strong>一度で移動できます</strong>。
            </Note>
          </Section>

          <Section id="inline" title="5. 一覧でその場で直す">
            <p>一覧の中で、開き直さずにそのまま直せる項目があります。</p>
            <Shot
              src="04-inline-edit"
              alt="一覧の各行。大項目・中項目・状態が選択欄になっている"
              caption="色のついた欄はその場で変えられます"
            />
            <Table
              head={["直したいもの", "やり方"]}
              rows={[
                ["タイトル", "タイトル横の ✎ を押す。Enterで保存、Escで取り消し"],
                ["大項目", "上の選択欄から選ぶ"],
                ["中項目", "下の選択欄から選ぶ。「＋ 新しい中項目を入力…」で新規も可"],
                ["状態", "色のついた選択欄から選ぶ"],
                ["削除", "行の右にある赤い「削除」ボタン"],
                ["その他", "「…」ボタンから複製・アーカイブなど"],
              ]}
            />
            <Note tone="tip">
              状態を「完成」に変えても、
              <strong>その行は消えずにその場に残ります</strong>。
              絞り込み中でも見失いません（薄い黄色の印が付きます）。
            </Note>
          </Section>

          <Section id="bulk" title="6. まとめて変える">
            <p>
              各行の左端にあるチェックを付けると、画面の下に
              <strong>まとめて操作するバー</strong>が出ます。
            </p>
            <Shot
              src="05-bulk"
              alt="複数行を選んだときに画面下部に出る操作バー"
              caption="選んだ件数と、まとめてできる操作が並びます"
            />
            <List
              items={[
                "状態をまとめて変更",
                "大項目をまとめて変更",
                "大項目をまとめて追加（横断。いまの大項目は残したまま別の棚にも並べる）",
                "まとめてアーカイブ／完全に削除",
              ]}
            />
            <Note tone="warn">
              「完全に削除」は<strong>元に戻せません</strong>。
              あとで戻す可能性があるものは「アーカイブ」をお使いください。
            </Note>
          </Section>

          <Section id="detail" title="7. 資料を開く・詳しく見る">
            <p>タイトルを押すと、その資料の詳しい画面が開きます。</p>
            <Shot
              src="07-detail"
              alt="資料の詳細画面"
              caption="登録されている情報がすべて見られます"
            />
            <List
              items={[
                "「資料を開く」…登録されたURLをブラウザの別のタブで開きます",
                "保存場所（共有フォルダのパス）はコピーして、エクスプローラーに貼り付けて使います",
                "「← ◯◯ の一覧へ戻る」で、元の大項目に戻れます",
              ]}
            />
          </Section>

          <Section id="new" title="8. 資料を1件ずつ登録する">
            <p>
              「＋ 新しい教材を登録」から登録します。
              <strong>必ず入れるのはタイトルと大項目だけ</strong>で、
              他は空のままでも登録できます。
            </p>
            <Shot
              src="08-form"
              alt="新しい教材を登録する画面"
              caption="分からない項目は空のままで構いません。あとから足せます"
            />
            <Note tone="tip">
              分類がまだ決まっていないものは、大項目を「分類待ち」や「仮置きBOX」にして
              先に登録しておき、あとから整理するのがおすすめです。
            </Note>
          </Section>

          <Section id="csv" title="9. CSVでまとめて登録する">
            <p>Excelで一覧を作ってある場合は、CSVにして一度に取り込めます。</p>
            <Shot
              src="10-import"
              alt="CSV取り込みの画面。登録できる行とエラー行の件数が出ている"
              caption="取り込む前に、何件登録できるかを確認できます"
            />
            <Steps
              items={[
                "Excelで「ファイル ＞ 名前を付けて保存」→ 種類を「CSV UTF-8」にして保存",
                "「CSV取り込み」画面でそのファイルを選ぶ",
                "「登録できる行」「エラー行」の件数を確認する",
                "問題なければ登録ボタンを押す",
              ]}
            />
            <List
              items={[
                "見出しの行は自動で探すので、Excelの装飾行が上にあっても大丈夫です",
                "列の名前が多少違っても読み取ります（「資料名」→タイトル など）",
                "タイトルが空の行は登録できません（エラー行として数えます）",
                "大項目が空の行は「分類待ち」として取り込みます",
              ]}
            />
          </Section>

          <Section id="categories" title="10. 分類を整える">
            <p>
              上のメニューの「分類の管理」で、大項目・中項目・小項目の
              <strong>名前を変えたり、並ぶ順番を入れ替えたり</strong>できます。
            </p>
            <Shot
              src="09-categories"
              alt="分類の管理画面。大項目の下に中項目・小項目が並んでいる"
              caption="▲▼ で順番を入れ替え、✎ で名前を変えます"
            />
            <Note tone="warn">
              名前を変えると、<strong>その分類を使っている資料すべてが同時に書き換わります</strong>。
              取り消しはできないので、大きく変える前はバックアップをおすすめします。
            </Note>

            <SubTitle>新しい大項目を作る</SubTitle>
            <p>ホームの「大項目から探す」にある「＋ 大項目を追加」から作れます。</p>
            <Shot
              src="12-add-major"
              alt="大項目を追加する入力欄"
              caption="番号を付けると並びが揃います（例：5｜新しい棚）"
            />
            <p>
              資料が1件もない大項目も、空の棚としてカードに並びます。
              先に棚だけ作っておき、あとから資料を入れることもできます。
            </p>
          </Section>

          <Section id="cross" title="11. 1つの資料を複数の大項目に入れる">
            <p>
              「営業でも使うし、研修でも使う」という資料は、
              <strong>複数の大項目に同時に入れられます</strong>。
            </p>
            <Steps
              items={[
                "登録・編集画面の「横断して入れる大項目」から追加する",
                "または一覧で複数選び、下のバーの「大項目をまとめて追加…（横断）」を使う",
              ]}
            />
            <List
              items={[
                "どちらの大項目のカードを開いても、同じ資料が出てきます",
                "一覧では分類の欄に緑の印（＋ 大項目名）が付きます",
                "カードの件数を足すと登録件数より多くなります。二重に数えているためで、不具合ではありません",
              ]}
            />
          </Section>

          <Section id="save" title="12. データを守る">
            <p>
              このツールのデータは、設定によって
              <strong>ブラウザの中</strong>か<strong>サーバー</strong>のどちらかに保存されます。
            </p>
            <Shot
              src="11-backup"
              alt="バックアップ画面"
              caption="「バックアップ」画面。保存場所の設定と書き出しができます"
            />

            <SubTitle>ブラウザ内保存で使っている場合</SubTitle>
            <Note tone="warn">
              赤い帯で「いまのデータはこのブラウザの中にしかありません」と出ているときは、
              <strong>ブラウザを閉じるとデータが消えることがあります。</strong>
              かならず保存先ファイルを決めてください。
            </Note>
            <Steps
              items={[
                "赤い帯の「保存先ファイルを決める」を押す",
                "共有フォルダなど、保存したい場所とファイル名を決める",
                "以降は変更のたびに自動でそのファイルへ書き出されます",
              ]}
            />
            <p>
              ブラウザを開き直したときに「自動保存が止まっています」と出たら、
              「自動保存を再開する」を押してください。
            </p>

            <SubTitle>念のためのバックアップ</SubTitle>
            <p>
              大きな変更の前は、「バックアップ」画面の
              「JSONバックアップを書き出す」で控えを取っておくと安心です。
              戻すときは同じ画面の「復元する」から読み込みます。
            </p>
          </Section>

          <Section id="login" title="13. 他のPCから使う">
            <p>
              サーバー保存に設定してある場合は、
              <strong>許可されたアカウントだけ</strong>がログインして、
              どのPC・スマホからでも同じデータを見られます。
            </p>
            <List
              items={[
                "サイトを開くとログイン画面が出ます",
                "管理者から伝えられたメールアドレスとパスワードを入れます",
                "パスワードは「パスワードを忘れた」から変更できます",
                "使い終わったら、画面右上の「ログアウト」を押してください",
              ]}
            />
            <Note tone="info">
              「このアカウントは許可されていません」と出た場合は、
              ログイン自体は成功しています。管理者に利用の許可を依頼してください。
            </Note>
          </Section>

          <Section id="trouble" title="14. 困ったときは">
            <Table
              head={["こんなとき", "こうしてください"]}
              rows={[
                [
                  "資料が見つからない",
                  "検索欄にことばを入れる。それでも出ないときは「すべての教材を一覧で見る」で全件から探す",
                ],
                [
                  "絞り込んだまま戻れない",
                  "「条件をすべて解除」を押す。または「← 大項目の一覧に戻る」",
                ],
                [
                  "変更したのに一覧から消えた",
                  "絞り込み条件から外れただけです。変更直後は薄い黄色で残ります。条件を解除すれば通常表示に戻ります",
                ],
                [
                  "間違って削除した",
                  "完全に削除したものは戻せません。バックアップがあれば「復元する」から戻せます",
                ],
                [
                  "データが消えた",
                  "保存先ファイルが未設定だった可能性があります。「バックアップ」画面から保存先を決めてください",
                ],
                [
                  "CSVでエラー行が出る",
                  "タイトルが空の行が原因のことがほとんどです。Excel側でタイトルを埋めてから取り込み直してください",
                ],
              ]}
            />
          </Section>

          <div className="border-t border-slate-200 pt-6">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="focus-ring inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-base font-bold text-slate-800 hover:bg-slate-50"
            >
              ↑ ページの先頭へ戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 部品                                                                */
/* ------------------------------------------------------------------ */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 border-b-2 border-[#0f5c3f] pb-2 text-xl font-bold text-[#0e2245] sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-4 text-[16px] leading-8 text-slate-800">{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-bold text-[#0e2245]">{children}</h3>;
}

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE}/manual/${src}.png`}
        alt={alt}
        loading="lazy"
        className="w-full rounded-xl border border-slate-300 shadow-sm"
      />
      <figcaption className="mt-2 text-sm text-slate-500">{caption}</figcaption>
    </figure>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="mt-0.5 shrink-0 text-[#0f5c3f]">
            ●
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f5c3f] text-sm font-bold text-white">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <thead className="bg-[#0e2245] text-white">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-3 text-[15px] font-bold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-slate-200 align-top">
              {row.map((cell, i) => (
                <td
                  key={cell}
                  className={
                    i === 0
                      ? "w-1/3 bg-slate-50 px-4 py-3 text-[15px] font-bold text-slate-800"
                      : "px-4 py-3 text-[15px] text-slate-700"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ tone, children }: { tone: "info" | "tip" | "warn"; children: ReactNode }) {
  const style = {
    info: "border-slate-300 bg-slate-50 text-slate-800",
    tip: "border-[#0f5c3f] bg-[#e4f0e9] text-[#0e2245]",
    warn: "border-amber-400 bg-amber-50 text-amber-900",
  }[tone];
  const label = { info: "補足", tip: "コツ", warn: "注意" }[tone];
  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${style}`}>
      <p className="mb-1 text-sm font-bold">{label}</p>
      <div className="text-[15px] leading-7">{children}</div>
    </div>
  );
}
