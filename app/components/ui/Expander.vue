<template>
    <div z20 wfull rounded-md bg-fs3>
        <div
            flex="~ items-center justify-between"
            cursor-pointer
            select-none
            p4
            @click="isOpen = !isOpen"
        >
            <slot />
            <UiButton
                h8
                w8
                rounded="!"
                pl="!"
                variant="secondary"
                alignment="center"
                icon="heroicons-solid:chevron-down"
                icon-size="20"
                motion-safe:transition-transform
                :icon-class="isOpen && 'rotate-180 transform'"
            />
        </div>
        <Transition
            enter-from-class="h0"
            leave-to-class="h0"
            enter-active-class="motion-safe:animate-in motion-safe:fade-in motion-safe:transition-height overflow-hidden"
            leave-active-class="motion-safe:animate-out motion-safe:fade-out motion-safe:transition-height overflow-hidden"
            enter-to-class="h[--height]"
            leave-from-class="h[--height]"
            :style="{ '--height': `${height}px` }"
        >
            <div v-if="isOpen" ref="contentRef" wfull rounded-b-md bg-fs3>
                <div px4 pb4 :class="contentClass">
                    <slot name="content" />
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>({ required: false, default: false });

defineProps<{
    contentClass?: unknown;
}>();

const contentRef = ref<HTMLDivElement>();
const height = ref(0);

watch(isOpen, async (value) => {
    if (value) {
        await nextTick();
        height.value = contentRef.value!.scrollHeight;
    }
});
</script>
