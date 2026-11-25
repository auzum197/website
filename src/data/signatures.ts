const R = String.raw

const n = (words: string): string =>
  R`&& \htmlClass{note}{\small\text{${words}}}`

/** Key holder, from spending key (0) to public (3). */
export type Level = 0 | 1 | 2 | 3

export type Block =
  | { label: string; math: string; levels?: readonly Level[] }
  | { label?: string; figure: "keys" | "sigs" | "signers" }

export interface Section {
  title: string
  blocks: readonly Block[]
}

export const signers: readonly {
  holder: string
  receive: boolean
  spend: boolean | string
}[] = [
  { holder: "sk", receive: true, spend: true },
  { holder: "ak, nk, rivk", receive: true, spend: "proof only" },
  { holder: "dk, ivk", receive: true, spend: false },
  { holder: "address", receive: false, spend: false },
]

export const sections: readonly Section[] = [
  {
    title: "Receive-authority signature",
    blocks: [
      {
        label: "Definitions",
        math: R`\begin{aligned}
\mathsf{addr} &= \mathsf{d} \,\|\, \mathsf{repr}(\mathsf{pk_d}) ${n("raw address")} \\
\mathsf{g_d} &= \mathsf{DiversifyHash}(\mathsf{d}) ${n("base point")} \\
\mathsf{pk_d} &= [\mathsf{ivk}]\, \mathsf{g_d} ${n("public key")} \\
\mathit{digest} &= \mathsf{BLAKE2b\text{-}256}\big(\texttt{"ZOrchRecvSig"} \,\|\, \mathit{coinType},\;\; \mathtt{0x01} \,\|\, \mathsf{addr} \,\|\, \mathit{msg}\big) ${n("message digest")} \\
H^*(x) &= \mathsf{LEOS2IP}_{512}\big(\mathsf{BLAKE2b\text{-}512}(\texttt{"ZcashRecvSigHash"},\; x)\big) \bmod r_{\mathbb{P}} ${n("hash to scalar")}
\end{aligned}`,
      },
      {
        label: "Sign",
        math: R`\begin{aligned}
T &\xleftarrow{\$} \{0,1\}^{256} ${n("fresh randomness")} \\
k &= H^*\big(\mathtt{0x00} \,\|\, T \,\|\, \mathsf{I2LEOSP}_{256}(\mathsf{ivk}) \,\|\, \mathit{digest}\big), \quad k \neq 0 ${n("hedged nonce")} \\
R &= [k]\, \mathsf{g_d} ${n("commitment")} \\
c &= H^*\big(\mathtt{0x01} \,\|\, \mathsf{repr}(R) \,\|\, \mathsf{addr} \,\|\, \mathit{digest}\big) ${n("challenge")} \\
s &= k + c \cdot \mathsf{ivk} \bmod r_{\mathbb{P}} ${n("response")} \\
\mathit{sig} &= \mathtt{0x01} \,\|\, \mathsf{repr}(R) \,\|\, \mathsf{I2LEOSP}_{256}(s) ${n("65 bytes")}
\end{aligned}`,
      },
      {
        label: "Verify",
        math: R`\begin{aligned}
& R \neq \mathcal{O}, \quad \mathsf{pk_d} \neq \mathcal{O}, \quad s < r_{\mathbb{P}} ${n("else reject")} \\
& c = H^*\big(\mathtt{0x01} \,\|\, \mathsf{repr}(R) \,\|\, \mathsf{addr} \,\|\, \mathit{digest}\big) ${n("same challenge")} \\
& [s]\, \mathsf{g_d} \overset{?}{=} R + [c]\, \mathsf{pk_d} ${n("accept if equal")}
\end{aligned}`,
      },
    ],
  },
  {
    title: "Spend-authority signature",
    blocks: [
      {
        label: "Definitions",
        math: R`\begin{aligned}
\mathsf{addr} &= \mathsf{d} \,\|\, \mathsf{repr}(\mathsf{pk_d}) ${n("raw address")} \\
\mathsf{g_d} &= \mathsf{DiversifyHash}(\mathsf{d}) ${n("base point")} \\
\mathsf{ak}^{\mathbb{P}} &= [\mathsf{ask}]\, \mathcal{G} ${n("validating key")} \\
\mathsf{ivk} &= \mathsf{Commit}^{\mathsf{ivk}}_{\mathsf{rivk}}\big(\mathsf{Extract}_{\mathbb{P}}(\mathsf{ak}^{\mathbb{P}}),\, \mathsf{nk}\big) ${n("viewing key")} \\
\mathsf{pk_d} &= [\mathsf{ivk}]\, \mathsf{g_d} ${n("address key")} \\
\mathit{digest} &= \mathsf{BLAKE2b\text{-}256}\big(\texttt{"ZOrchAddrSig"} \,\|\, \mathit{coinType},\;\; \mathtt{0x01} \,\|\, \mathsf{addr} \,\|\, \mathsf{repr}(\mathsf{rk}) \,\|\, \pi \,\|\, \mathit{msg}\big) ${n("message digest")} \\
H(x) &= \mathsf{LEOS2IP}_{512}\big(\mathsf{BLAKE2b\text{-}512}(\texttt{"Zcash\_RedPallasH"},\; x)\big) \bmod r_{\mathbb{P}} ${n("hash to scalar")}
\end{aligned}`,
      },
      {
        label: "Statement",
        math: R`\begin{aligned}
x &= (\mathsf{g_d},\, \mathsf{pk_d},\, \mathsf{rk}) ${n("public input")} \\
w &= (\mathsf{ak}^{\mathbb{P}},\, \alpha,\, \mathsf{nk},\, \mathsf{rivk}) ${n("witness")} \\
\mathcal{R}(x, w) &\iff \mathsf{rk} = \mathsf{ak}^{\mathbb{P}} + [\alpha]\, \mathcal{G} ${n("spend authority")} \\
&\;\land\;\; \mathsf{ivk} = \mathsf{Commit}^{\mathsf{ivk}}_{\mathsf{rivk}}\big(\mathsf{Extract}_{\mathbb{P}}(\mathsf{ak}^{\mathbb{P}}),\, \mathsf{nk}\big) ${n("ivk from keys")} \\
&\;\land\;\; \big(\mathsf{ivk} = \bot \;\lor\; \mathsf{pk_d} = [\mathsf{ivk}]\, \mathsf{g_d}\big) ${n("address integrity")}
\end{aligned}`,
      },
      {
        label: "Sign",
        math: R`\begin{aligned}
\alpha &\xleftarrow{\$} \mathbb{F}_{r_{\mathbb{P}}} ${n("fresh randomizer")} \\
\mathsf{rk} &= \mathsf{ak}^{\mathbb{P}} + [\alpha]\, \mathcal{G}, \quad \mathsf{rk} \neq \mathcal{O} ${n("randomized key")} \\
\pi &= \mathsf{Prove}(x;\, w) ${n("Halo 2 proof")} \\
\mathsf{rsk} &= \mathsf{ask} + \alpha \bmod r_{\mathbb{P}} ${n("randomized secret")} \\
T &\xleftarrow{\$} \{0,1\}^{256} ${n("fresh randomness")} \\
B_i &= \mathsf{BLAKE2b\text{-}512}\big(\texttt{"ZOrchAddrSigNonc"},\;\; [i] \,\|\, \mathsf{I2LEOSP}_{256}(\mathsf{rsk}) \,\|\, T \,\|\, \mathit{digest}\big), \quad i \in \{0, 1\} ${n("hedge with rsk")} \\
T' &= (B_0 \,\|\, B_1)_{[0..80)} ${n("80 bytes")} \\
r &= H\big(T' \,\|\, \mathsf{repr}(\mathsf{rk}) \,\|\, \mathit{digest}\big) ${n("nonce")} \\
R &= [r]\, \mathcal{G} ${n("commitment")} \\
c &= H\big(\mathsf{repr}(R) \,\|\, \mathsf{repr}(\mathsf{rk}) \,\|\, \mathit{digest}\big) ${n("challenge")} \\
S &= r + c \cdot \mathsf{rsk} \bmod r_{\mathbb{P}} ${n("response")} \\
\sigma &= \mathsf{repr}(R) \,\|\, \mathsf{I2LEOSP}_{256}(S) ${n("64 bytes")} \\
\mathit{sig} &= \mathtt{0x01} \,\|\, \mathsf{repr}(\mathsf{rk}) \,\|\, \sigma \,\|\, \pi ${n("2,881 bytes")}
\end{aligned}`,
      },
      {
        label: "Verify",
        math: R`\begin{aligned}
& \mathsf{rk} \neq \mathcal{O}, \quad \mathsf{pk_d} \neq \mathcal{O} ${n("else reject")} \\
& c = H\big(\mathsf{repr}(R) \,\|\, \mathsf{repr}(\mathsf{rk}) \,\|\, \mathit{digest}\big) ${n("same challenge")} \\
& [S]\, \mathcal{G} \overset{?}{=} R + [c]\, \mathsf{rk} ${n("signature check")} \\
& \mathsf{Verify}(\pi;\, x) \overset{?}{=} 1 ${n("proof check")}
\end{aligned}`,
      },
    ],
  },
  {
    title: "Where the signatures connect",
    blocks: [{ figure: "sigs" }, { label: "Who can sign", figure: "signers" }],
  },
  {
    title: "Recap: Orchard key derivation",
    blocks: [
      { figure: "keys" },
      {
        label: "Spending key",
        levels: [0, 0],
        math: R`\begin{aligned}
\mathsf{sk} &\xleftarrow{\$} \{0,1\}^{256} ${n("root secret")} \\
\mathsf{ask} &= \mathsf{ToScalar}\big(\mathsf{PRF}^{\mathsf{expand}}_{\mathsf{sk}}([\mathtt{0x06}])\big) ${n("spend authorizing key")}
\end{aligned}`,
      },
      {
        label: "Full viewing key",
        levels: [1, 1, 1],
        math: R`\begin{aligned}
\mathsf{ak}^{\mathbb{P}} &= [\mathsf{ask}]\, \mathcal{G}, \quad \mathsf{ak} = \mathsf{Extract}_{\mathbb{P}}(\mathsf{ak}^{\mathbb{P}}) ${n("spend validating key")} \\
\mathsf{nk} &= \mathsf{ToBase}\big(\mathsf{PRF}^{\mathsf{expand}}_{\mathsf{sk}}([\mathtt{0x07}])\big) ${n("nullifier key")} \\
\mathsf{rivk} &= \mathsf{ToScalar}\big(\mathsf{PRF}^{\mathsf{expand}}_{\mathsf{sk}}([\mathtt{0x08}])\big) ${n("commitment randomness")}
\end{aligned}`,
      },
      {
        label: "Incoming viewing key",
        levels: [2, 2],
        math: R`\begin{aligned}
\mathsf{ivk} &= \mathsf{Commit}^{\mathsf{ivk}}_{\mathsf{rivk}}(\mathsf{ak},\, \mathsf{nk}), \quad \mathsf{ivk} \notin \{0, \bot\} ${n("one-way hash")} \\
\mathsf{dk} \,\|\, \mathsf{ovk} &= \mathsf{PRF}^{\mathsf{expand}}_{\mathsf{rivk}}\big([\mathtt{0x82}] \,\|\, \mathsf{ak} \,\|\, \mathsf{nk}\big) ${n("diversifier key, outgoing key")}
\end{aligned}`,
      },
      {
        label: "Address",
        levels: [3, 3, 3, 3],
        math: R`\begin{aligned}
\mathsf{d} &= \mathsf{FF1\text{-}AES256}_{\mathsf{dk}}(j) ${n("diversifier, index j")} \\
\mathsf{g_d} &= \mathsf{DiversifyHash}(\mathsf{d}) ${n("base point")} \\
\mathsf{pk_d} &= [\mathsf{ivk}]\, \mathsf{g_d} ${n("transmission key")} \\
\mathsf{addr} &= \mathsf{d} \,\|\, \mathsf{repr}(\mathsf{pk_d}) ${n("43 bytes")}
\end{aligned}`,
      },
    ],
  },
]
