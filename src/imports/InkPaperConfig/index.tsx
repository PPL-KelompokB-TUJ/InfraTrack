import svgPaths from "./svg-5qf8xbjb97";
import imgAdministratorProfile from "./44b7ee1e8963c2b26ee8c74974c90154d586fbb8.png";

function Image() {
  return (
    <div className="relative shrink-0 size-[1280px]" data-name="image">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1280 1280">
        <g clipPath="url(#clip0_1_1591)" id="image">
          <path d={svgPaths.p38224540} fill="var(--fill-0, black)" id="Vector" opacity="0.02" />
        </g>
        <defs>
          <clipPath id="clip0_1_1591">
            <rect fill="white" height="1280" width="1280" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ImageClip() {
  return (
    <div className="absolute content-stretch flex flex-col inset-[0_0_0.01px_0] items-start overflow-clip pb-[8.11px]" data-name="image clip">
      <Image />
    </div>
  );
}

function Image2() {
  return (
    <div className="relative shrink-0 size-[100px]" data-name="image">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g id="image">
          <path d={svgPaths.p3de73e80} id="Vector" stroke="var(--stroke-0, #805062)" strokeOpacity="0.05" strokeWidth="4.16667" />
          <path d={svgPaths.p12ad0f0} id="Vector_2" stroke="var(--stroke-0, #805062)" strokeOpacity="0.05" strokeWidth="4.16667" />
        </g>
      </svg>
    </div>
  );
}

function Image1() {
  return (
    <div className="absolute opacity-50 right-[25px] size-[100px] top-[25px]" data-name="Image">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Image2 />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-center pb-[0.59px] relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#805062] text-[48px] text-center tracking-[-0.96px] whitespace-nowrap">
        <p className="leading-[57.6px]">{`Ink & Paper`}</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-center pb-[25.6px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Italic',sans-serif] font-light italic justify-center leading-[0] relative shrink-0 text-[#526069] text-[24px] text-center tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[33.6px]">{`System Configuration & Parameters`}</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7px] items-center relative size-full">
        <Heading1 />
        <Container />
        <div className="bg-[rgba(248,187,208,0.5)] h-px relative shrink-0 w-[96px]" data-name="Horizontal Divider" />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[9px] relative shrink-0 w-full" data-name="Heading 3">
      <div aria-hidden className="absolute border-[rgba(248,187,208,0.2)] border-b border-solid inset-0 pointer-events-none" />
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Regular',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#1a1c1c] text-[32px] whitespace-nowrap">
        <p className="leading-[41.6px]">Chapter I: Global Parameters</p>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[-1px]" data-name="Label">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#526069] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
        <p className="leading-[14.4px]">DATA RETENTION WINDOW</p>
      </div>
    </div>
  );
}

function LabelMargin() {
  return (
    <div className="h-[18.39px] relative shrink-0 w-full" data-name="Label:margin">
      <Label />
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[28.8px] overflow-auto relative shrink-0 w-full" data-name="Container">
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-0 not-italic text-[#1a1c1c] text-[18px] top-[13.5px] w-[70.01px]">
        <p className="leading-[28.8px]">30 Days</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start max-w-[448px] overflow-clip px-[12px] py-[8px] relative shrink-0 w-[448px]" data-name="Input">
      <Container3 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Italic',sans-serif] font-normal italic justify-center leading-[0] relative shrink-0 text-[#504447] text-[14px] w-full">
        <p className="leading-[21px]">Duration before ephemeral logs drift away.</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Margin">
      <Container4 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <LabelMargin />
      <Input />
      <Margin />
    </div>
  );
}

function Label1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[-1px]" data-name="Label">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#526069] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
        <p className="leading-[14.4px]">PRIMARY ACCESS KEY</p>
      </div>
    </div>
  );
}

function LabelMargin1() {
  return (
    <div className="h-[18.39px] relative shrink-0 w-full" data-name="Label:margin">
      <Label1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-auto relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Liberation_Mono:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1a1c1c] text-[18px] w-full">
        <p className="leading-[28.8px]">************************</p>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start max-w-[448px] overflow-clip px-[12px] py-[8px] relative shrink-0 w-[448px]" data-name="Input">
      <Container6 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <LabelMargin1 />
      <Input1 />
    </div>
  );
}

function Label2() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[-1px]" data-name="Label">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#526069] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap">
        <p className="leading-[14.4px]">REPORTING FREQUENCY</p>
      </div>
    </div>
  );
}

function LabelMargin2() {
  return (
    <div className="h-[18.39px] relative shrink-0 w-full" data-name="Label:margin">
      <Label2 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[0.8px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#1a1c1c] text-[18px] w-full">
        <p className="leading-[28.8px]">Daily (Evening Wind)</p>
      </div>
    </div>
  );
}

function Options() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center max-w-[448px] pb-[4px] pt-[3px] relative shrink-0 w-[448px]" data-name="Options">
      <Container8 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <LabelMargin2 />
      <Options />
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[32px] items-start pl-[16px] relative size-full">
        <Container2 />
        <Container5 />
        <Container7 />
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-start relative size-full">
        <Heading2 />
        <Container1 />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[9px] relative shrink-0 w-full" data-name="Heading 3">
      <div aria-hidden className="absolute border-[rgba(248,187,208,0.2)] border-b border-solid inset-0 pointer-events-none" />
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Regular',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#1a1c1c] text-[32px] whitespace-nowrap">
        <p className="leading-[41.6px]">Chapter II: Feature Flags</p>
      </div>
    </div>
  );
}

function Image3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="image">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="image">
          <path d={svgPaths.pf079980} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-[#2563eb] content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[16px]" data-name="Input">
      <Image3 />
    </div>
  );
}

function InputMargin() {
  return (
    <div className="content-stretch flex flex-col h-[20px] items-start pt-[4px] relative shrink-0 w-[16px]" data-name="Input:margin">
      <Input2 />
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pb-[0.59px] right-0 top-[-1px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1a1c1c] text-[16px] whitespace-nowrap">
        <p className="leading-[25.6px]">Enable S-Curve Interpolation</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[27.59px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Italic',sans-serif] font-normal italic justify-center leading-[0] relative shrink-0 text-[#526069] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Smooths visual data to mimic falling petals.</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[47.59px] relative shrink-0 w-[285.09px]" data-name="Container">
      <Container10 />
      <Container11 />
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Item">
      <InputMargin />
      <Container9 />
    </div>
  );
}

function Image4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="image">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="image">
          <path d={svgPaths.pf079980} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-[#2563eb] content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[16px]" data-name="Input">
      <Image4 />
    </div>
  );
}

function InputMargin1() {
  return (
    <div className="content-stretch flex flex-col h-[20px] items-start pt-[4px] relative shrink-0 w-[16px]" data-name="Input:margin">
      <Input3 />
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pb-[0.59px] right-0 top-[-1px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1a1c1c] text-[16px] whitespace-nowrap">
        <p className="leading-[25.6px]">Verbose Logging</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[27.6px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Italic',sans-serif] font-normal italic justify-center leading-[0] relative shrink-0 text-[#526069] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Capture every whisper of the network.</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[47.59px] relative shrink-0 w-[254.56px]" data-name="Container">
      <Container13 />
      <Container14 />
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Item">
      <InputMargin1 />
      <Container12 />
    </div>
  );
}

function InputMargin2() {
  return (
    <div className="content-stretch flex flex-col h-[20px] items-start pt-[4px] relative shrink-0 w-[16px]" data-name="Input:margin">
      <div className="bg-white relative shrink-0 size-[16px]" data-name="Input" />
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pb-[0.59px] right-0 top-[-1px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1a1c1c] text-[16px] whitespace-nowrap">
        <p className="leading-[25.6px]">Experimental Dashboards</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-0 top-[27.59px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Italic',sans-serif] font-normal italic justify-center leading-[0] relative shrink-0 text-[#526069] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Reveal unwritten futures (unstable).</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[47.59px] relative shrink-0 w-[235.48px]" data-name="Container">
      <Container16 />
      <Container17 />
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Item">
      <InputMargin2 />
      <Container15 />
    </div>
  );
}

function List() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="content-stretch flex flex-col gap-[24px] items-start pl-[16px] relative size-full">
        <Item />
        <Item1 />
        <Item2 />
      </div>
    </div>
  );
}

function Section1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24.01px] items-start pt-[15.99px] relative size-full">
        <Heading3 />
        <List />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-bl-[12px] rounded-br-[4px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" style={{ backgroundImage: "linear-gradient(167.127deg, rgb(248, 187, 208) 0%, rgb(252, 228, 236) 100%)" }} data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[12.39px] pt-[11px] px-[32px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#76485a] text-[12px] text-center tracking-[0.3px] whitespace-nowrap">
          <p className="leading-[14.4px]">Commit Changes</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(248,187,208,0.2)] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end pt-[33px] relative size-full">
        <Button />
      </div>
    </div>
  );
}

function Article() {
  return (
    <div className="bg-white max-w-[768px] relative rounded-[2px] self-stretch shrink-0 w-[768px]" data-name="Article">
      <div aria-hidden className="absolute border border-[rgba(248,187,208,0.3)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="content-stretch flex flex-col gap-[48px] items-start max-w-[inherit] pb-[65px] pt-[64px] px-[65px] relative size-full">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0_0.01px_0] rounded-[2px] shadow-[0px_4px_20px_-2px_rgba(82,96,105,0.05)]" data-name="Article:shadow" />
        <Image1 />
        <Header />
        <Section />
        <Section1 />
        <HorizontalBorder />
      </div>
    </div>
  );
}

function MainContentCanvas() {
  return (
    <div className="h-[1289.12px] min-h-[1288px] relative shrink-0 w-full" data-name="Main Content Canvas">
      <div className="flex flex-row justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center min-h-[inherit] pb-[72px] pt-[112px] px-[24px] relative size-full">
          <Article />
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[17.025px] relative shrink-0 w-[17.043px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.0429 17.0247">
        <g id="Container">
          <path d={svgPaths.p139bcec0} fill="var(--fill-0, #805062)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Overlay() {
  return (
    <div className="bg-[rgba(128,80,98,0.1)] content-stretch flex h-[40px] items-center justify-center relative rounded-[12px] shrink-0 w-[34.69px]" data-name="Overlay">
      <Container19 />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#805062] text-[32px] whitespace-nowrap">
        <p className="leading-[32px] mb-0">Spring</p>
        <p className="leading-[32px]">Thief</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[0.585px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#526069] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[14.4px] mb-0">Infrastructure</p>
        <p className="leading-[14.4px]">Management</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col gap-[3.195px] items-start relative shrink-0 w-[100.04px]" data-name="Container">
      <Heading />
      <Container21 />
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Overlay />
      <Container20 />
    </div>
  );
}

function Margin1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[48px] pt-[16px] px-[24px] relative size-full">
        <Container18 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="-translate-y-1/2 absolute h-[16.992px] left-[24px] top-1/2 w-[16.995px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.9955 16.9923">
        <g id="Container">
          <path d={svgPaths.p12cee600} fill="var(--fill-0, #526069)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function LinkInactiveTab() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Link - Inactive Tab">
      <Container22 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] left-[60.02px] not-italic text-[#526069] text-[12px] top-[calc(50%-0.7px)] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[14.4px]">First Breath</p>
      </div>
    </div>
  );
}

function LinkInactiveTabMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Link - Inactive Tab:margin">
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <LinkInactiveTab />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="-translate-y-1/2 absolute left-[24px] size-[20px] top-1/2" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Container">
          <path d={svgPaths.pa50fd00} fill="var(--fill-0, #526069)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function LinkInactiveTab1() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Link - Inactive Tab">
      <Container23 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] left-[60.02px] not-italic text-[#526069] text-[12px] top-[calc(50%-0.7px)] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[14.4px]">Scattered Petals</p>
      </div>
    </div>
  );
}

function LinkInactiveTabMargin1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Link - Inactive Tab:margin">
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <LinkInactiveTab1 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="-translate-y-1/2 absolute h-[19.5px] left-[16px] top-1/2 w-[22px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 19.5">
        <g id="Container">
          <path d={svgPaths.p3a06a480} fill="var(--fill-0, #76485A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function LinkActiveTabSystemConfigLogicalMapping() {
  return (
    <div className="bg-[#f8bbd0] h-[48px] relative rounded-[12px] shrink-0 w-full" data-name="Link - Active Tab (System Config logical mapping)">
      <Container24 />
      <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Inter:Regular',sans-serif] font-semibold justify-center leading-[0] left-[52.02px] not-italic text-[#76485a] text-[12px] top-[calc(50%-0.7px)] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[14.4px]">Echoes of Spring</p>
      </div>
    </div>
  );
}

function LinkActiveTabSystemConfigLogicalMappingMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Link - Active Tab (System Config logical mapping):margin">
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <LinkActiveTabSystemConfigLogicalMapping />
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Nav">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <LinkInactiveTabMargin />
        <LinkInactiveTabMargin1 />
        <LinkActiveTabSystemConfigLogicalMappingMargin />
      </div>
    </div>
  );
}

function AsideSideNavBar() {
  return (
    <div className="absolute backdrop-blur-[12px] bg-[rgba(243,243,243,0.8)] content-stretch flex flex-col h-[1288px] items-start left-0 pb-[24px] pr-px pt-[32px] rounded-br-[12px] rounded-tr-[12px] top-0 w-[256px]" data-name="Aside - SideNavBar">
      <div aria-hidden className="absolute border-[rgba(248,187,208,0.2)] border-r border-solid inset-0 pointer-events-none rounded-br-[12px] rounded-tr-[12px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] h-[1288px] left-0 shadow-[0px_10px_15px_-3px_rgba(128,80,98,0.05),0px_4px_6px_-4px_rgba(128,80,98,0.05)] top-0 w-[256px]" data-name="Aside - SideNavBar:shadow" />
      <Margin1 />
      <Nav />
    </div>
  );
}

function OffsetForSidebar() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[0.59px] relative shrink-0" data-name="Offset for sidebar">
      <div className="[word-break:break-word] flex flex-col font-['Playfair_Display:Italic',sans-serif] font-semibold italic justify-center leading-[0] relative shrink-0 text-[#805062] text-[24px] tracking-[-0.6px] whitespace-nowrap">
        <p className="leading-[33.6px]">InfraTrack</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute content-stretch flex items-center left-[256px] pl-[16px] top-[-1px]" data-name="Container">
      <OffsetForSidebar />
    </div>
  );
}

function Margin2() {
  return (
    <div className="h-[33.59px] relative shrink-0 w-[382.27px]" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container25 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="[word-break:break-word] flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] w-full">
          <p className="leading-[normal]">Search parameters...</p>
        </div>
      </div>
    </div>
  );
}

function Input4() {
  return (
    <div className="bg-[#f3f3f3] relative rounded-[12px] shrink-0 w-[192px]" data-name="Input">
      <div className="content-stretch flex items-start justify-center overflow-clip pb-[9px] pl-[37px] pr-[17px] pt-[8px] relative rounded-[inherit] size-full">
        <Container28 />
      </div>
      <div aria-hidden className="absolute border border-[#d4c2c6] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute bottom-[20.59%] content-stretch flex flex-col items-start left-[12px] top-[20.59%]" data-name="Container">
      <div className="relative shrink-0 size-[10.5px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 10.5">
          <path d={svgPaths.p210dd580} fill="var(--fill-0, #504447)" id="Icon" />
        </svg>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Input4 />
      <Container29 />
    </div>
  );
}

function Container31() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
        <g id="Container">
          <path d={svgPaths.p164b49c0} fill="var(--fill-0, #504447)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[20px] relative shrink-0 w-[20.1px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.1 20">
        <g id="Container">
          <path d={svgPaths.p3cdadd00} fill="var(--fill-0, #504447)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function AdministratorProfile() {
  return (
    <div className="pointer-events-none relative rounded-[12px] shrink-0 size-[32px]" data-name="Administrator Profile">
      <div className="absolute inset-0 overflow-hidden rounded-[12px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAdministratorProfile} />
      </div>
      <div aria-hidden className="absolute border border-[rgba(248,187,208,0.5)] border-solid inset-0 rounded-[12px]" />
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Container31 />
      <Container32 />
      <AdministratorProfile />
    </div>
  );
}

function Container26() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Container27 />
        <Container30 />
      </div>
    </div>
  );
}

function TopNavBar() {
  return (
    <div className="absolute backdrop-blur-[12px] bg-[rgba(249,249,249,0.7)] content-stretch flex items-center justify-between left-0 max-w-[1440px] pb-[9px] pt-[8px] px-[24px] top-0 w-[1280px]" data-name="TopNavBar">
      <div aria-hidden className="absolute border-[rgba(248,187,208,0.3)] border-b border-solid inset-0 pointer-events-none shadow-[0px_1px_2px_0px_rgba(82,96,105,0.05)]" />
      <Margin2 />
      <Container26 />
    </div>
  );
}

export default function InkPaperConfig() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[256px] relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Ink & Paper (Config)">
      <ImageClip />
      <MainContentCanvas />
      <AsideSideNavBar />
      <TopNavBar />
    </div>
  );
}