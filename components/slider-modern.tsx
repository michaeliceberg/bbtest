import * as React from "react";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "@radix-ui/react-slider";

type Props = {
    randomValueForSlider: number;
    rightAnswer: number;
    sliderValue: number[];
    setSliderValue: (id: number[]) => void;
    options: string[],
}



export const SliderModern = ({
    randomValueForSlider,
    rightAnswer,
    sliderValue,
    setSliderValue,
    options,
}: Props) => {

    

    const intOptions:number[] = options.map(el => +el)
    const defaultValue=[Math.round((rightAnswer/2 + 3/2*rightAnswer*randomValueForSlider)*10)/10] 

    // const minV= Math.round((rightAnswer/2 + 3/2*rightAnswer*randomValueForSlider)*10)/10

    // const maxV= Math.round((rightAnswer + 3/2*rightAnswer*randomValueForSlider)*10)/10

    const minV= Math.min(...intOptions)
    const maxV= Math.max(...intOptions)

    // const step = Math.round(1/2*rightAnswer/10*10)/10
    const step = 1

    // const onValueChange = () => {(val) => setSliderValue(val)}
    
    return(
    

    <form>
		<Slider
			className="relative flex h-5  touch-none select-none items-center"
			defaultValue={defaultValue}
			max={maxV}
			step={step}
            min={minV}
            onValueChange={(val) => setSliderValue(val)}
		>
			{/* <SliderTrack className="relative h-[3px] grow rounded-full bg-blackA7"> */}
			<SliderTrack className="relative h-[8px] grow rounded-full bg-sky-100">
				<SliderRange className="absolute h-full rounded-full bg-sky-400/90" />
			</SliderTrack>
			<SliderThumb
				// className="block size-5 rounded-[10px] bg-white shadow-[0_2px_10px] shadow-blackA4 hover:bg-violet3 focus:shadow-[0_0_0_5px] focus:shadow-blackA5 focus:outline-none"
				className="block size-5 rounded-[10px] bg-white shadow-[0_8px_20px] shadow-sky-800 hover:bg-sky-500/90 focus:shadow-[0_0_0_3px] focus:shadow-800 focus:outline-none"
				aria-label="Volume"
			/>
		</Slider>
	</form>)
};

// export default SliderModern;
