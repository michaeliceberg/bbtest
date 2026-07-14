import { Button } from '@/components/ui/button'
const ButtonsPage = () => {
	return (
		<div className='p-4 space-y-4 flex flex-col max-w-[200px]'>
			<Button>Дефолт</Button>
			<Button variant='primary'>Особая</Button>
			<Button variant='primaryOutline'>Особая Outline</Button>
			<Button variant='secondary'>Вторая</Button>
			<Button variant='secondaryOutline'>Вторая Outline</Button>
			<Button variant='danger'>Опасность</Button>
			<Button variant='dangerOutline'>Опасность Outline</Button>
			<Button variant='super'>Супер</Button>
			<Button variant='superOutline'>Супер Outline</Button>
			<Button variant='ghost'>Призрак</Button>
			<Button variant='sidebar'>СайдБар</Button>
			<Button variant='sidebarOutline'>СайдБар Outline</Button>
			<Button variant='isLate'>-20</Button>
			<Button variant='isNotLate'>+10</Button>
			<Button variant='statDefault'>0.5</Button>
			<Button variant='today'>0.5</Button>
			<Button variant='construct'> x </Button>




			
		</div>
	)
}
export default ButtonsPage
