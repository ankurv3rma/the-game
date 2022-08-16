import { ReactElement, ReactNode, useState } from "react";
import { MdClose } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
const Modal = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) => {
  // const [isOpen, setOpen] = useState(open);
  // const close = () => {
  //   setOpen(false);
  // };
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0.5, y: "-10%" }}
          animate={{ opacity: 1, y: "0" }}
          exit={{ opacity: 0.0, y: "50%", transition: { duration: 0.2 } }}
          // transition={{
          //   duration: 0.3,
          //   ease: "easeIn",
          // }}
          className="fixed w-screen h-screen flex flex-col items-center justify-center bg-black bg-opacity-25 z-10 will-change-transform"
        >
          <div className="relative w-96 h-96 bg-gray-900 bg-opacity-80 rounded-2xl ">
            {/* <div
              className="absolute -top-10 -right-10 w-8 h-8 flex items-center justify-center bg-white bg-opacity-80 rounded-full cursor-pointer"
              onClick={onClose}
            >
              <MdClose className="" />
              <div className="absolute bottom-0 left-0 w-[1.6rem] h-0.5 bg-white bg-opacity-80 transform rotate-[135deg] translate-x-1.5 -translate-y-0.5 origin-top-left cursor-default"></div>
            </div> */}
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
export default Modal;
