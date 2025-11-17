import React from 'react'

const Bar = ({step}) => {
  return (
    <div className="px-1">
            <div className="relative w-full bg-white h-1 rounded-full dark:bg-gray-700 overflow-hidden ">
              <div
                className="h-1 bg-gray-700 dark:bg-white"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
  )
}

export default Bar